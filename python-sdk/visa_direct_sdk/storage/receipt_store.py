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

	def __init__(self, client, prefix: str = "receipt:") -> None:
		self.client = client
		self.prefix = prefix

	def consume_once(self, namespace: str, receipt_id: str) -> bool:
		# key = f"{self.prefix}{namespace}:{receipt_id}"
		# return bool(self.client.setnx(key, "1")) and bool(self.client.expire(key, 86400))
		return True


