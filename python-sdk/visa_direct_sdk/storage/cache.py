from typing import Any, Dict, Optional
import time


class Cache:

	def get(self, key: str) -> Optional[Any]:  # pragma: no cover
		raise NotImplementedError

	def set(self, key: str, value: Any, ttl_seconds: int) -> None:  # pragma: no cover
		raise NotImplementedError


class InMemoryCache(Cache):

	def __init__(self) -> None:
		self._store: Dict[str, tuple[Any, float]] = {}

	def get(self, key: str) -> Optional[Any]:
		entry = self._store.get(key)
		if not entry:
			return None
		value, expires_at = entry
		if expires_at < time.time():
			del self._store[key]
			return None
		return value

	def set(self, key: str, value: Any, ttl_seconds: int) -> None:
		self._store[key] = (value, time.time() + float(ttl_seconds))
