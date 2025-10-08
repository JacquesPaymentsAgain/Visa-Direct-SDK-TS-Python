from typing import Any, Dict
from ..transport.secure_http_client import SecureHttpClient
from ..storage.cache import Cache, InMemoryCache


class QuotingService:

	def __init__(self, http: SecureHttpClient, cache: Cache = None) -> None:
		self.http = http
		self.cache = cache or InMemoryCache()

	def lock(self, src_currency: str, dst_currency: str, amount_minor: int) -> Dict[str, Any]:
		key = f"quote:{src_currency}:{dst_currency}:{amount_minor}"
		value, should_revalidate = self.cache.get_with_revalidate(key)
		if value:
			if should_revalidate:
				self._revalidate(key, src_currency, dst_currency, amount_minor)
			return value
		return self._fetch_and_cache(key, src_currency, dst_currency, amount_minor)

	def _fetch_and_cache(self, key: str, src_currency: str, dst_currency: str, amount_minor: int) -> Dict[str, Any]:
		data, _, _ = self.http.post("/forexrates/v1/lock", {
			"src": src_currency,
			"dst": dst_currency,
			"amount": {"minor": amount_minor}
		})
		self.cache.set(key, data, 300)  # 5 min TTL for quotes
		return data

	def _revalidate(self, key: str, src_currency: str, dst_currency: str, amount_minor: int) -> None:
		try:
			data, _, _ = self.http.post("/forexrates/v1/lock", {
				"src": src_currency,
				"dst": dst_currency,
				"amount": {"minor": amount_minor}
			})
			self.cache.set(key, data, 300)
		except Exception:  # noqa: BLE001
			pass
