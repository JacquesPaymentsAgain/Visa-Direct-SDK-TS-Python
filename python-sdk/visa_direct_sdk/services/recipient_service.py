from typing import Any, Dict
from ..transport.secure_http_client import SecureHttpClient
from ..storage.cache import Cache, InMemoryCache


class RecipientService:

	def __init__(self, http: SecureHttpClient, cache: Cache = None) -> None:
		self.http = http
		self.cache = cache or InMemoryCache()

	def resolve_alias(self, alias: str, alias_type: str) -> Dict[str, Any]:
		key = f"alias:{alias_type}:{alias}"
		value, should_revalidate = self.cache.get_with_revalidate(key)
		if value:
			if should_revalidate:
				self._revalidate(key, "/visaaliasdirectory/v1/resolve", {"alias": alias, "aliasType": alias_type})
			return value
		return self._fetch_and_cache(key, "/visaaliasdirectory/v1/resolve", {"alias": alias, "aliasType": alias_type}, 60)

	def pav(self, pan_token: str) -> Dict[str, Any]:
		key = f"pav:{pan_token}"
		value, should_revalidate = self.cache.get_with_revalidate(key)
		if value:
			if should_revalidate:
				self._revalidate(key, "/pav/v1/card/validation", {"panToken": pan_token})
			return value
		return self._fetch_and_cache(key, "/pav/v1/card/validation", {"panToken": pan_token}, 60)

	def ftai(self, pan_token: str) -> Dict[str, Any]:
		key = f"ftai:{pan_token}"
		value, should_revalidate = self.cache.get_with_revalidate(key)
		if value:
			if should_revalidate:
				self._revalidate(key, "/paai/v1/fundstransfer/attributes/inquiry", {"panToken": pan_token})
			return value
		return self._fetch_and_cache(key, "/paai/v1/fundstransfer/attributes/inquiry", {"panToken": pan_token}, 60)

	def validate(self, destination_hash: str, payload: Dict[str, Any]) -> Dict[str, Any]:
		key = f"validate:{destination_hash}"
		value, should_revalidate = self.cache.get_with_revalidate(key)
		if value:
			if should_revalidate:
				self._revalidate(key, "/visapayouts/v3/payouts/validate", payload)
			return value
		return self._fetch_and_cache(key, "/visapayouts/v3/payouts/validate", payload, 60)

	def _fetch_and_cache(self, key: str, path: str, payload: Dict[str, Any], ttl_seconds: int) -> Dict[str, Any]:
		data, _, _ = self.http.post(path, payload)
		self.cache.set(key, data, ttl_seconds)
		return data

	def _revalidate(self, key: str, path: str, payload: Dict[str, Any]) -> None:
		try:
			data, _, _ = self.http.post(path, payload)
			self.cache.set(key, data, 60)
		except Exception:  # noqa: BLE001
			# best-effort refresh
			pass
