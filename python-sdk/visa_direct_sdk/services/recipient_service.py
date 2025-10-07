from typing import Any, Dict
from ..transport.secure_http_client import SecureHttpClient
from ..storage.cache import Cache, InMemoryCache


class RecipientService:

	def __init__(self, http: SecureHttpClient, cache: Cache = None) -> None:
		self.http = http
		self.cache = cache or InMemoryCache()

	def resolve_alias(self, alias: str, alias_type: str) -> Dict[str, Any]:
		key = f"alias:{alias_type}:{alias}"
		cached = self.cache.get(key)
		if cached:
			return cached
		data, _, _ = self.http.post("/visaaliasdirectory/v1/resolve", {"alias": alias, "aliasType": alias_type})
		self.cache.set(key, data, 60)
		return data

	def pav(self, pan_token: str) -> Dict[str, Any]:
		key = f"pav:{pan_token}"
		cached = self.cache.get(key)
		if cached:
			return cached
		data, _, _ = self.http.post("/pav/v1/card/validation", {"panToken": pan_token})
		self.cache.set(key, data, 60)
		return data

	def ftai(self, pan_token: str) -> Dict[str, Any]:
		key = f"ftai:{pan_token}"
		cached = self.cache.get(key)
		if cached:
			return cached
		data, _, _ = self.http.post("/paai/v1/fundstransfer/attributes/inquiry", {"panToken": pan_token})
		self.cache.set(key, data, 60)
		return data

	def validate(self, destination_hash: str, payload: Dict[str, Any]) -> Dict[str, Any]:
		key = f"validate:{destination_hash}"
		cached = self.cache.get(key)
		if cached:
			return cached
		data, _, _ = self.http.post("/visapayouts/v3/payouts/validate", payload)
		self.cache.set(key, data, 60)
		return data
