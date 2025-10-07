import json
import os
import re
import time
from typing import Any, Dict, Optional, Tuple

import requests
from jwcrypto import jwk, jwe
from ..errors import JWEKidUnknownError, JWEDecryptError


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

		payload: Any = data
		req_headers = dict(headers or {})
		if self.requires_mle(path):
			jwe_ct, kid = self._encrypt_jwe(data)
			payload = jwe_ct
			req_headers["content-type"] = "application/jose"
			req_headers["x-jwe-kid"] = kid

		resp = self.session.post(self.base_url + path, json=None if self.requires_mle(path) else payload, data=payload if self.requires_mle(path) else None, headers=req_headers, cert=self.cert, verify=self.verify)
		resp.raise_for_status()

		res_data: Any = resp.json() if not self.requires_mle(path) else None
		if self.requires_mle(path):
			try:
				res_data = self._decrypt_jwe(resp.text)
			except JWEKidUnknownError:
				self._refresh_jwks()
				res_data = self._decrypt_jwe(resp.text)
			except Exception as e:  # noqa: BLE001
				raise JWEDecryptError(str(e))

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
		r = self.session.get(url, timeout=5)
		r.raise_for_status()
		self._jwks_cache = r.json()
		self._jwks_expires = now + ttl
		return self._jwks_cache

	def _refresh_jwks(self) -> None:
		self._jwks_cache = None
		self._jwks_expires = 0.0
		self._get_jwks()

	def _encrypt_jwe(self, payload: Dict[str, Any]) -> Tuple[str, str]:
		jwks = self._get_jwks()
		keys = jwks.get("keys", [])
		if not keys:
			# fallback: no-op JSON, but preserve contract
			return json.dumps(payload), "none"
		k = keys[0]
		kid = k.get("kid", "unknown")
		pub = jwk.JWK(**k)
		protected = {"alg": "RSA-OAEP-256", "enc": "A256GCM", "kid": kid}
		jwetoken = jwe.JWE(json.dumps(payload).encode("utf-8"), json.dumps(protected))
		jwetoken.add_recipient(pub)
		return jwetoken.serialize(compact=True), kid

	def _decrypt_jwe(self, token: str) -> Dict[str, Any]:
		# accept plain JSON (simulator fallback)
		if token and token.strip().startswith("{"):
			return json.loads(token)
		jwks = self._get_jwks()
		kset = jwks.get("keys", [])
		header = json.loads(jwe.JWE().deserialize(token).protected)
		kid = header.get("kid")
		match = next((x for x in kset if x.get("kid") == kid), None)
		if not match:
			raise JWEKidUnknownError("Unknown kid")
		priv = jwk.JWK(**match)
		jwetoken = jwe.JWE()
		jwetoken.deserialize(token)
		jwetoken.decrypt(priv)
		return json.loads(jwetoken.payload.decode("utf-8"))
