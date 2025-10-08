import time

try:  # pragma: no cover - optional dependency at runtime
	import boto3
except ModuleNotFoundError:  # pragma: no cover
	boto3 = None


class ReceiptStore:

	def consume_once(self, namespace: str, receipt_id: str) -> bool:  # pragma: no cover
		raise NotImplementedError


class InMemoryReceiptStore(ReceiptStore):

	def __init__(self) -> None:
		self._used: set[str] = set()

	def consume_once(self, namespace: str, receipt_id: str) -> bool:
		key = f"{namespace}:{receipt_id}"
		if key in self._used:
			return False
		self._used.add(key)
		return True


class RedisReceiptStore(ReceiptStore):

	def __init__(self, client, prefix: str = "receipt:", ttl_seconds: int = 86400) -> None:
		self.client = client
		self.prefix = prefix
		self.ttl_seconds = ttl_seconds

	def consume_once(self, namespace: str, receipt_id: str) -> bool:
		key = f"{self.prefix}{namespace}:{receipt_id}"
		if hasattr(self.client, "set"):
			result = self.client.set(key, "1", nx=True, ex=self.ttl_seconds)
			return bool(result)
		if hasattr(self.client, "setnx"):
			if not self.client.setnx(key, "1"):
				return False
			if hasattr(self.client, "expire"):
				self.client.expire(key, self.ttl_seconds)
			return True
		raise RuntimeError("Redis client must expose set (nx=True) or setnx")


class DynamoReceiptStore(ReceiptStore):

	def __init__(self, table_name: str, client=None, *, ttl_seconds: int = 86400) -> None:
		if client is None:
			if boto3 is None:  # pragma: no cover
				raise RuntimeError("boto3 is required for DynamoReceiptStore")
			client = boto3.client("dynamodb")
		self.client = client
		self.table_name = table_name
		self.ttl_seconds = ttl_seconds

	def consume_once(self, namespace: str, receipt_id: str) -> bool:
		composite = f"{namespace}#{receipt_id}"
		item = {
			"receiptId": {"S": composite},
			"ttl": {"N": str(int(time.time()) + self.ttl_seconds)}
		}
		try:
			self.client.put_item(
				TableName=self.table_name,
				Item=item,
				ConditionExpression="attribute_not_exists(receiptId)"
			)
			return True
		except Exception as exc:  # noqa: BLE001
			name = getattr(exc, "response", {}).get("Error", {}).get("Code") if hasattr(exc, "response") else getattr(exc, "name", "")
			if name == "ConditionalCheckFailedException":
				return False
			raise
