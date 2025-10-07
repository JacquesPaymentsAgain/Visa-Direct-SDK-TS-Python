from dataclasses import dataclass
from typing import Dict, Any, Union

from ..transport.secure_http_client import SecureHttpClient
from ..storage.idempotency_store import IdempotencyStore, InMemoryIdempotencyStore
from ..storage.receipt_store import ReceiptStore, InMemoryReceiptStore
from ..utils.events import LogEmitter


class LedgerNotConfirmed(Exception):
	pass


class AFTDeclined(Exception):
	pass


class PISFailed(Exception):
	pass


class ReceiptReused(Exception):
	pass


_DEFAULT_IDEM_TTL_SECONDS = 3600


@dataclass
class Amount:
	currency: str
	minor: int


class Orchestrator:

	def __init__(self, http: SecureHttpClient, *, idempotency_store: Union[IdempotencyStore, None] = None, receipt_store: Union[ReceiptStore, None] = None) -> None:
		self.http = http
		self.idem = idempotency_store or InMemoryIdempotencyStore()
		self.receipts = receipt_store or InMemoryReceiptStore()
		self.events = LogEmitter()

	def payout(self, req: Dict[str, Any]) -> Any:
		idem_key = req["idempotencyKey"]
		cached = self.idem.get(idem_key)
		if cached is not None:
			return cached

		funding = req["funding"]
		ftype = funding["type"]

		if ftype == "INTERNAL":
			if not funding.get("debitConfirmed") or not funding.get("confirmationRef"):
				raise LedgerNotConfirmed("Internal ledger debit not confirmed")
		elif ftype == "AFT":
			receipt_id = funding["receiptId"]
			if not self.receipts.consume_once("AFT", receipt_id):
				raise ReceiptReused("AFT receipt already used")
			if funding.get("status") != "approved":
				raise AFTDeclined("AFT not approved")
		elif ftype == "PIS":
			pid = funding["paymentId"]
			if not self.receipts.consume_once("PIS", pid):
				raise ReceiptReused("PIS payment already used")
			if funding.get("status") != "executed":
				raise PISFailed("PIS not executed")

		dst = req["destination"]
		dtype = dst["type"]
		if dtype == "CARD":
			path = "/visadirect/fundstransfer/v1/pushfunds"
		elif dtype == "ACCOUNT":
			path = "/accountpayouts/v1/payout"
		elif dtype == "WALLET":
			path = "/walletpayouts/v1/payout"
		else:
			raise ValueError("Unknown destination type")

		headers = {"x-idempotency-key": idem_key}
		data = {
			"originatorId": req["originatorId"],
			"funding": funding,
			"destination": dst,
			"amount": req["amount"],
		}
		try:
			res_data, _, _ = self.http.post(path, data, headers=headers)
			self.idem.put(idem_key, res_data, _DEFAULT_IDEM_TTL_SECONDS)
			return res_data
		except Exception as e:  # noqa: BLE001
			# Best-effort compensation event emission (no await guaranteed)
			import asyncio
			asyncio.run(self.events.emit({
				"event": "payout_failed_requires_compensation",
				"sagaId": idem_key,
				"funding": funding,
				"reason": "NetworkError",
				"metadata": {"message": str(e)},
				"timestamp": datetime.utcnow().isoformat() + "Z"
			}))
			raise
