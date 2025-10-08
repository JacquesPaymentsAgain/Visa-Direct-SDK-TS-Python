from typing import Any, Dict, Optional
import time
import json

try:  # pragma: no cover
	import boto3
except ModuleNotFoundError:  # pragma: no cover
	boto3 = None


class Cache:

	def get(self, key: str) -> Optional[Any]:  # pragma: no cover
		raise NotImplementedError

	def set(self, key: str, value: Any, ttl_seconds: int) -> None:  # pragma: no cover
		raise NotImplementedError

	def get_with_revalidate(self, key: str) -> tuple[Optional[Any], bool]:  # pragma: no cover
		raise NotImplementedError


class InMemoryCache(Cache):

	def __init__(self) -> None:
		self._store: Dict[str, tuple[Any, float, float]] = {}

	def get(self, key: str) -> Optional[Any]:
		entry = self._store.get(key)
		if not entry:
			return None
		value, expires_at, _created = entry
		if expires_at < time.time():
			del self._store[key]
			return None
		return value

	def set(self, key: str, value: Any, ttl_seconds: int) -> None:
		now = time.time()
		self._store[key] = (value, now + float(ttl_seconds), now)

	def get_with_revalidate(self, key: str) -> tuple[Optional[Any], bool]:
		entry = self._store.get(key)
		if not entry:
			return None, False
		value, expires_at, created_at = entry
		now = time.time()
		if expires_at < now:
			del self._store[key]
			return None, False
		ttl = expires_at - created_at
		age = now - created_at
		return value, age > ttl / 2 if ttl > 0 else False


class DynamoCache(Cache):

	def __init__(self, table_name: str, client=None, *, payload_attribute: str = "payload", ttl_attribute: str = "ttl", created_at_attribute: str = "createdAt") -> None:
		if client is None:
			if boto3 is None:  # pragma: no cover
				raise RuntimeError("boto3 is required for DynamoCache")
			client = boto3.client("dynamodb")
		self.client = client
		self.table_name = table_name
		self.payload_attribute = payload_attribute
		self.ttl_attribute = ttl_attribute
		self.created_at_attribute = created_at_attribute

	def get(self, key: str) -> Optional[Any]:
		response = self.client.get_item(TableName=self.table_name, Key={"cacheKey": {"S": key}})
		item = response.get("Item")
		if not item:
			return None
		ttl_attr = item.get(self.ttl_attribute, {}).get("N")
		if ttl_attr and float(ttl_attr) < time.time():
			return None
		payload = item.get(self.payload_attribute, {}).get("S")
		return None if payload is None else json.loads(payload)

	def set(self, key: str, value: Any, ttl_seconds: int) -> None:
		now = int(time.time())
		item = {
			"cacheKey": {"S": key},
			self.payload_attribute: {"S": json.dumps(value)},
			self.ttl_attribute: {"N": str(now + int(ttl_seconds))},
			self.created_at_attribute: {"N": str(now)}
		}
		self.client.put_item(TableName=self.table_name, Item=item)

	def get_with_revalidate(self, key: str) -> tuple[Optional[Any], bool]:
		response = self.client.get_item(TableName=self.table_name, Key={"cacheKey": {"S": key}})
		item = response.get("Item")
		if not item:
			return None, False
		ttl_attr = item.get(self.ttl_attribute, {}).get("N")
		created_attr = item.get(self.created_at_attribute, {}).get("N")
		if ttl_attr and float(ttl_attr) < time.time():
			return None, False
		payload = item.get(self.payload_attribute, {}).get("S")
		value = None if payload is None else json.loads(payload)
		if not ttl_attr or not created_attr:
			return value, False
		ttl = float(ttl_attr) - float(created_attr)
		age = time.time() - float(created_attr)
		return value, age > ttl / 2 if ttl > 0 else False
