from typing import Any, Dict, Optional, Tuple
import time


class IdempotencyStore:

	def get(self, key: str) -> Optional[Any]:  # pragma: no cover
		raise NotImplementedError

	def put(self, key: str, value: Any, ttl_seconds: int) -> None:  # pragma: no cover
		raise NotImplementedError


class InMemoryIdempotencyStore(IdempotencyStore):

	def __init__(self) -> None:
		self._store: Dict[str, Tuple[Any, float]] = {}

	def get(self, key: str) -> Optional[Any]:
		entry = self._store.get(key)
		if not entry:
			return None
		value, expires_at = entry
		if expires_at < time.time():
			del self._store[key]
			return None
		return value

	def put(self, key: str, value: Any, ttl_seconds: int) -> None:
		self._store[key] = (value, time.time() + float(ttl_seconds))


class RedisIdempotencyStore(IdempotencyStore):

	def __init__(self, client, prefix: str = "idem:") -> None:
		self.client = client
		self.prefix = prefix

	def get(self, key: str) -> Optional[Any]:
		# raw = self.client.get(self.prefix + key)
		# return json.loads(raw) if raw else None
		return None

	def put(self, key: str, value: Any, ttl_seconds: int) -> None:
		# self.client.setex(self.prefix + key, int(ttl_seconds), json.dumps(value))
		return None


