import json
import time
from typing import Any, Dict, Optional, Tuple, Callable

try:  # pragma: no cover
	boto3 = __import__("boto3")
except ModuleNotFoundError:  # pragma: no cover
	boto3 = None


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

	def __init__(self, client, prefix: str = "idem:", serializer: Callable[[Any], str] = json.dumps, deserializer: Callable[[str], Any] = json.loads) -> None:
		self.client = client
		self.prefix = prefix
		self._serialize = serializer
		self._deserialize = deserializer

	def get(self, key: str) -> Optional[Any]:
		raw = self.client.get(f"{self.prefix}{key}")
		if raw is None:
			return None
		if isinstance(raw, bytes):
			raw = raw.decode("utf-8")
		return self._deserialize(raw)

	def put(self, key: str, value: Any, ttl_seconds: int) -> None:
		payload = self._serialize(value)
		name = f"{self.prefix}{key}"
		if hasattr(self.client, "setex"):
			self.client.setex(name, int(ttl_seconds), payload)
			return
		if hasattr(self.client, "set"):
			self.client.set(name, payload, ex=int(ttl_seconds))
			return
		raise RuntimeError("Redis client must expose setex or set with ex parameter")


class DynamoIdempotencyStore(IdempotencyStore):

	def __init__(self, table_name: str, client=None, *, payload_attribute: str = "payload", ttl_attribute: str = "ttl") -> None:
		if client is None:
			if boto3 is None:  # pragma: no cover
				raise RuntimeError("boto3 is required for DynamoIdempotencyStore")
			client = boto3.client("dynamodb")
		self.client = client
		self.table_name = table_name
		self.payload_attribute = payload_attribute
		self.ttl_attribute = ttl_attribute

	def get(self, key: str) -> Optional[Any]:
		response = self.client.get_item(TableName=self.table_name, Key={"idk": {"S": key}})
		item = response.get("Item")
		if not item:
			return None
		ttl_attr = item.get(self.ttl_attribute, {}).get("N")
		if ttl_attr and float(ttl_attr) < time.time():
			return None
		payload = item.get(self.payload_attribute, {}).get("S")
		return None if payload is None else json.loads(payload)

	def put(self, key: str, value: Any, ttl_seconds: int) -> None:
		item = {
			"idk": {"S": key},
			self.payload_attribute: {"S": json.dumps(value)},
			self.ttl_attribute: {"N": str(int(time.time()) + int(ttl_seconds))}
		}
		try:
			self.client.put_item(
				TableName=self.table_name,
				Item=item,
				ConditionExpression="attribute_not_exists(idk)"
			)
		except Exception as exc:  # noqa: BLE001
			name = getattr(exc, "response", {}).get("Error", {}).get("Code") if hasattr(exc, "response") else getattr(exc, "name", "")
			if name != "ConditionalCheckFailedException":
				raise
