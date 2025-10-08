import time
from typing import Optional
import pytest

from visa_direct_sdk.core.orchestrator import Orchestrator, ReceiptReused
from visa_direct_sdk.storage.idempotency_store import DynamoIdempotencyStore
from visa_direct_sdk.storage.receipt_store import DynamoReceiptStore


class FakeDynamoClient:

	def __init__(self) -> None:
		self._tables: dict[str, dict[str, dict[str, dict[str, str]]]] = {}

	def _table(self, name: str) -> dict[str, dict[str, dict[str, str]]]:
		return self._tables.setdefault(name, {})

	def get_item(self, TableName: str, Key: dict) -> dict:
		table = self._table(TableName)
		attribute = next(iter(Key.values()))
		key = attribute.get("S")
		item = table.get(key)
		if not item:
			return {}
		ttl_attr = item.get("ttl", {}).get("N")
		if ttl_attr and float(ttl_attr) < time.time():
			table.pop(key, None)
			return {}
		return {"Item": item}

	def put_item(self, TableName: str, Item: dict, ConditionExpression: Optional[str] = None) -> dict:
		table = self._table(TableName)
		primary = next((Item[k] for k in ("idk", "receiptId", "cacheKey") if k in Item), None)
		key = primary.get("S") if primary else next(iter(Item.values())).get("S")
		if ConditionExpression and "attribute_not_exists" in ConditionExpression and key in table:
			err = Exception("ConditionalCheckFailedException")
			setattr(err, "name", "ConditionalCheckFailedException")  # pragma: no cover - for compatibility
			raise err
		table[key] = Item
		return {}


class StubHttpClient:

	def __init__(self) -> None:
		self.calls = 0

	def post(self, path, data, headers=None):  # noqa: ANN001
		self.calls += 1
		return ({"payoutId": f"payout-{self.calls}", "status": "executed"}, 200, {})


def make_request(**overrides):
	request = {
		"originatorId": "fi-dynamo",
		"destination": {"type": "CARD", "panToken": "tok_pan_411111******1111"},
		"amount": {"currency": "USD", "minor": 115},
		"preflight": {}
	}
	request.update(overrides)
	return request


def test_dynamo_idempotency_shares_results():
	dynamo = FakeDynamoClient()
	id_store = DynamoIdempotencyStore("idem-table", client=dynamo)
	receipt_store = DynamoReceiptStore("receipt-table", client=dynamo)
	http = StubHttpClient()
	orch_a = Orchestrator(http, idempotency_store=id_store, receipt_store=receipt_store)
	orch_b = Orchestrator(http, idempotency_store=id_store, receipt_store=receipt_store)

	result_1 = orch_a.payout(make_request(idempotencyKey="idem-1", funding={"type": "INTERNAL", "debitConfirmed": True, "confirmationRef": "conf"}))
	result_2 = orch_b.payout(make_request(idempotencyKey="idem-1", funding={"type": "INTERNAL", "debitConfirmed": True, "confirmationRef": "conf"}))

	assert result_1["payoutId"] == "payout-1"
	assert result_2 == result_1
	assert http.calls == 1


def test_dynamo_receipt_store_blocks_reuse():
	dynamo = FakeDynamoClient()
	id_store = DynamoIdempotencyStore("idem-table-2", client=dynamo)
	receipt_store = DynamoReceiptStore("receipt-table-2", client=dynamo)
	http = StubHttpClient()
	orch_a = Orchestrator(http, idempotency_store=id_store, receipt_store=receipt_store)
	orch_b = Orchestrator(http, idempotency_store=id_store, receipt_store=receipt_store)

	orch_a.payout(make_request(
		idempotencyKey="idem-2",
		funding={"type": "AFT", "receiptId": "receipt-xyz", "status": "approved"}
	))

	with pytest.raises(ReceiptReused):
		orch_b.payout(make_request(
			idempotencyKey="idem-3",
			funding={"type": "AFT", "receiptId": "receipt-xyz", "status": "approved"}
		))

	assert http.calls == 1
