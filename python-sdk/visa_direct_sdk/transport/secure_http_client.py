import json
import os
import re
import time
from typing import Any, Dict, Optional, Tuple

import requests
from jwcrypto import jwk, jwe
from ..errors import JWEKidUnknownError, JWEDecryptError
from ..utils.otel import use_span


class SecureHttpClient:

	def __init__(
		self,
		*,
		base_url: Optional[str] = None,
		cert_path: Optional[str] = None,
		key_path: Optional[str] = None,
		ca_path: Optional[str] = None,
		endpoints_file: Optional[str] = None,
	):

		endpoints_path = endpoints_file or os.path.abspath(os.path.join(os.getcwd(), "../endpoints/endpoints.json"))
		with open(endpoints_path, "r", encoding="utf-8") as f:
			raw = f.read()

		# simple ${VAR:-default} substitution
		def subst_env(match: re.Match[str]) -> str:
			var_name = match.group(1)
			default = match.group(2) or ""
			return os.environ.get(var_name, default)

		with_env = re.sub(r"\$\{([^:}]+)(?::-(.*?))?}", subst_env, raw)
		self.endpoints = json.loads(with_env)

		self.base_url = base_url or os.environ.get("VISA_BASE_URL") or self.endpoints["baseUrls"]["visa"]
		self.session = requests.Session()
		self.cert = (cert_path, key_path) if cert_path and key_path else cert_path
		self.verify = ca_path or True
		self._jwks_cache: Optional[Dict[str, Any]] = None
		self._jwks_expires: float = 0.0
		self._env_mode = "production" if os.environ.get("SDK_ENV") == "production" else "dev"

	def requires_mle(self, path: str) -> bool:
		for route in self.endpoints.get("routes", []):
			rp = route.get("path")
			if rp == path or (":" in rp and self._match_param_route(rp, path)):
				return bool(route.get("requiresMLE"))
		return False

	def _match_param_route(self, template: str, actual: str) -> bool:
		t = template.split("/")
		a = actual.split("/")
		if len(t) != len(a):
			return False
		for i in range(len(t)):
			if t[i].startswith(":"):
				continue
			if t[i] != a[i]:
				return False
		return True

	def post(self, path: str, data: Dict[str, Any], *, headers: Optional[Dict[str, str]] = None) -> Tuple[Dict[str, Any], int, Dict[str, Any]]:

		with use_span("secure_http_client.post", {
			"http.method": "POST",
			"http.url": f"{self.base_url}{path}",
			"visa.requires_mle": self.requires_mle(path),
			"visa.sdk.env": self._env_mode,
		}) as span:
			payload: Any = data
			req_headers = dict(headers or {})
			requires_mle = self.requires_mle(path)
			used_encryption = False

			if requires_mle:
				body, extra_headers, used_encryption = self._encrypt_jwe(data, span)
				payload = body
				req_headers.update(extra_headers)

			resp = self.session.post(
				self.base_url + path,
				json=payload if not requires_mle or not used_encryption else None,
				data=payload if requires_mle and used_encryption else None,
				headers=req_headers,
				cert=self.cert,
				verify=self.verify,
			)
			resp.raise_for_status()

			if requires_mle and used_encryption:
				try:
					res_data = self._decrypt_jwe(resp.text, span)
				except JWEKidUnknownError:
					if span:
						span.add_event("jwe.decrypt.retry_on_kid_miss")
					self._refresh_jwks()
					res_data = self._decrypt_jwe(resp.text, span)
				except Exception as e:  # noqa: BLE001
					if span:
						span.add_event("jwe.decrypt.error")
					raise JWEDecryptError(str(e))
			else:
				res_data = self._parse_maybe_json(resp.text if isinstance(resp.text, str) else resp.content)

			if span:
				span.set_attribute("http.status_code", resp.status_code)

			return res_data, resp.status_code, dict(resp.headers)

	def _get_jwks(self) -> Dict[str, Any]:
		now = time.time()
		ttl = float(self.endpoints.get("jwks", {}).get("cacheTtlSeconds", 300))
		if self._jwks_cache and self._jwks_expires > now:
			return self._jwks_cache
		url = self.endpoints.get("jwks", {}).get("url")
		if not url:
			self._jwks_cache = {"keys": []}
			self._jwks_expires = now + ttl
			return self._jwks_cache
		try:
			r = self.session.get(url, timeout=5)
			r.raise_for_status()
			self._jwks_cache = r.json()
			self._jwks_expires = now + ttl
			return self._jwks_cache
		except requests.RequestException as exc:
			if self._env_mode == "production":
				raise JWEDecryptError(f"Unable to fetch JWKS: {exc}") from exc
			self._jwks_cache = {"keys": []}
			self._jwks_expires = now + ttl
			return self._jwks_cache

	def _refresh_jwks(self) -> None:
		self._jwks_cache = None
		self._jwks_expires = 0.0
		self._get_jwks()

	def _parse_maybe_json(self, payload: Any) -> Any:
		if isinstance(payload, (bytes, bytearray)):
			payload = payload.decode("utf-8")
		if isinstance(payload, str):
			try:
				return json.loads(payload)
			except json.JSONDecodeError:
				return payload
		return payload

	def _encrypt_jwe(self, payload: Dict[str, Any], span=None) -> Tuple[Any, Dict[str, str], bool]:
		jwks = self._get_jwks()
		keys = jwks.get("keys", [])
		if not keys:
			if self._env_mode == "production":
				if span:
					span.add_event("jwe.encrypt.failure")
				raise JWEDecryptError("JWKS unavailable for MLE encryption")
			if span:
				span.add_event("jwe.encrypt.dev_passthrough")
			return payload, {"content-type": "application/json"}, False
		k = keys[0]
		kid = k.get("kid", "unknown")
		pub = jwk.JWK(**k)
		protected = {"alg": "RSA-OAEP-256", "enc": "A256GCM", "kid": kid}
		jwetoken = jwe.JWE(json.dumps(payload).encode("utf-8"), json.dumps(protected))
		jwetoken.add_recipient(pub)
		if span:
			span.add_event("jwe.encrypt.success", {"kid": kid})
		return jwetoken.serialize(compact=True), {"content-type": "application/jose", "x-jwe-kid": kid}, True

	def _decrypt_jwe(self, token: str, span=None) -> Dict[str, Any]:
		# accept plain JSON (simulator fallback)
		if token and token.strip().startswith("{"):
			return json.loads(token)
		jwks = self._get_jwks()
		kset = jwks.get("keys", [])
		header = json.loads(jwe.JWE().deserialize(token).protected)
		kid = header.get("kid")
		match = next((x for x in kset if x.get("kid") == kid), None)
		if not match:
			if span:
				span.add_event("jwe.decrypt.unknown_kid", {"kid": kid})
			raise JWEKidUnknownError("Unknown kid")
		priv = jwk.JWK(**match)
		jwetoken = jwe.JWE()
		jwetoken.deserialize(token)
		jwetoken.decrypt(priv)
		if span:
			span.add_event("jwe.decrypt.success")
		return json.loads(jwetoken.payload.decode("utf-8"))
