from dataclasses import dataclass
from typing import Dict, Any, Union, Optional, Tuple
from datetime import datetime, timezone

from ..transport.secure_http_client import SecureHttpClient
from ..storage.idempotency_store import IdempotencyStore, InMemoryIdempotencyStore
from ..storage.receipt_store import ReceiptStore, InMemoryReceiptStore
from ..utils.events import LogEmitter
from ..utils.otel import use_span
from ..services.recipient_service import RecipientService
from ..services.quoting_service import QuotingService
from ..services.compliance_service import ComplianceService
from ..policy.corridor_policy import get_rules, load_policy
from ..errors import DestinationNotAllowedError, QuoteExpiredError, QuoteRequiredError


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

	def __init__(
		self,
		http: SecureHttpClient,
		*,
		idempotency_store: Union[IdempotencyStore, None] = None,
		receipt_store: Union[ReceiptStore, None] = None,
		events=None,
		recipient_service: Union[RecipientService, None] = None,
		quoting_service: Union[QuotingService, None] = None,
		compliance_service: Union[ComplianceService, None] = None,
	) -> None:
		self.http = http
		self.idem = idempotency_store or InMemoryIdempotencyStore()
		self.receipts = receipt_store or InMemoryReceiptStore()
		self.events = events or LogEmitter()
		self.recipient_service = recipient_service or RecipientService(http)
		self.quoting_service = quoting_service or QuotingService(http)
		self.compliance_service = compliance_service or ComplianceService(http)
		self._corridor_policy = None

	def payout(self, req: Dict[str, Any]) -> Any:
		with use_span("orchestrator.payout", {
			"visa.destination.type": req.get("destination", {}).get("type"),
			"visa.amount.currency": req.get("amount", {}).get("currency"),
			"visa.fx.lock_hint": bool(req.get("preflight", {}).get("fxLock")),
		}) as span:
			idem_key = req["idempotencyKey"]
			cached = self.idem.get(idem_key)
			if cached is not None:
				if span:
					span.add_event("idempotency.hit")
				return cached

			funding = req["funding"]
			ftype = funding["type"]

			with use_span("orchestrator.guards", {"visa.funding.type": ftype}):
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

			destination, fx_quote_id = self._run_preflight(req, span)
			dtype = destination["type"]
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
				"destination": destination,
				"amount": req["amount"],
				"fxQuoteId": fx_quote_id,
			}
			try:
				res_data, _, _ = self.http.post(path, data, headers=headers)
				self.idem.put(idem_key, res_data, _DEFAULT_IDEM_TTL_SECONDS)
				return res_data
			except Exception as e:  # noqa: BLE001
				if span:
					span.add_event("orchestrator.compensation_emitted")
				# Best-effort compensation event emission (no await guaranteed)
				import asyncio
				payload = {
					"event": "payout_failed_requires_compensation",
					"sagaId": idem_key,
					"funding": funding,
					"reason": "NetworkError",
					"metadata": {"message": str(e)},
					"timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
				}
				data = {k: payload[k] for k in payload}
		try:
			loop = asyncio.get_running_loop()
		except RuntimeError:
			asyncio.run(self.events.emit(data))
		else:
			loop.create_task(self.events.emit(data))
		raise

	def _run_preflight(self, req: Dict[str, Any], span=None) -> Tuple[Dict[str, Any], Optional[str]]:
		destination = dict(req["destination"])
		preflight = dict(req.get("preflight") or {})

		if destination.get("type") == "ALIAS":
			with use_span("orchestrator.preflight.alias", {"visa.alias.type": destination.get("aliasType", "EMAIL")}):
				alias_result = self.recipient_service.resolve_alias(destination["alias"], destination.get("aliasType", "EMAIL"))
				self.recipient_service.pav(alias_result["panToken"])
				ftai_result = self.recipient_service.ftai(alias_result["panToken"])
				if ftai_result.get("octEligible") is False:
					raise ValueError("Destination panToken not OCT eligible")
				destination = {"type": "CARD", "panToken": alias_result["panToken"]}

		compliance_payload = preflight.get("compliancePayload")
		if compliance_payload:
			with use_span("orchestrator.preflight.compliance"):
				result = self.compliance_service.screen(compliance_payload)
				if not result.get("approved", True):
					raise ValueError("Compliance screening failed")

		fx_quote_id: Optional[str] = None
		if "fxLock" in preflight:
			params = preflight["fxLock"]
			with use_span("orchestrator.preflight.fx", {
				"visa.fx.src": params.get("srcCurrency"),
				"visa.fx.dst": params.get("dstCurrency"),
			}):
				amount_minor = params.get("amountMinor") or req["amount"]["minor"]
				quote = self.quoting_service.lock(params["srcCurrency"], params["dstCurrency"], amount_minor)
				expires = datetime.fromisoformat(quote["expiresAt"].replace("Z", "+00:00"))
				if expires <= datetime.now(expires.tzinfo or timezone.utc):
					raise QuoteExpiredError("Quote expired")
				fx_quote_id = quote["quoteId"]
		elif self._requires_quote(req):
			raise QuoteRequiredError("Quote required for cross-border payout")

		if span:
			span.set_attribute("visa.destination.final_type", destination["type"])

		corridor = preflight.get("corridor")
		if corridor:
			rules = self._resolve_corridor_rules(corridor)
			if rules.rails and rules.rails.get("allowedDestinations"):
				dest_type = self._map_destination_type(destination["type"])
				if dest_type not in rules.rails["allowedDestinations"]:
					raise DestinationNotAllowedError(
						f"Destination {dest_type} not permitted for corridor {corridor['sourceCountry']}->{corridor['targetCountry']}"
					)
			if rules.fx and rules.fx.get("lockRequired") and not fx_quote_id:
				raise QuoteRequiredError("FX quote required by corridor policy")

		return destination, fx_quote_id

	def _requires_quote(self, req: Dict[str, Any]) -> bool:
		currency = req.get("amount", {}).get("currency")
		if not currency:
			return False
		return currency != "USD"

	def _resolve_corridor_rules(self, corridor: Dict[str, Any]):
		if self._corridor_policy is None:
			self._corridor_policy = load_policy()
		return get_rules(
			self._corridor_policy,
			source_country=corridor["sourceCountry"],
			target_country=corridor["targetCountry"],
			source_currency=corridor.get("sourceCurrency"),
			target_currency=corridor.get("targetCurrency")
		)

	def _map_destination_type(self, dtype: str) -> str:
		if dtype == "CARD":
			return "card"
		if dtype == "ACCOUNT":
			return "account"
		if dtype == "WALLET":
			return "wallet"
		raise DestinationNotAllowedError(f"Unsupported destination type {dtype}")
