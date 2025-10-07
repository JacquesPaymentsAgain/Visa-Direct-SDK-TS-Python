from typing import Any, Dict, Optional
from datetime import datetime

from ..core.orchestrator import Orchestrator
from ..transport.secure_http_client import SecureHttpClient
from ..services.recipient_service import RecipientService
from ..services.quoting_service import QuotingService
from ..errors import QuoteRequiredError, QuoteExpiredError


class PayoutBuilder:

	def __init__(self, orchestrator: Orchestrator) -> None:
		self._orch = orchestrator
		self._originator_id: Optional[str] = None
		self._funding: Optional[Dict[str, Any]] = None
		self._destination: Optional[Dict[str, Any]] = None
		self._amount: Optional[Dict[str, Any]] = None
		self._idempotency_key: Optional[str] = None
		self._quote_id: Optional[str] = None
		self._quote_expires_at: Optional[str] = None

	@staticmethod
	def create(http: Optional[SecureHttpClient] = None) -> "PayoutBuilder":
		return PayoutBuilder(Orchestrator(http or SecureHttpClient()))

	def for_originator(self, originator_id: str) -> "PayoutBuilder":
		self._originator_id = originator_id
		return self

	def with_funding_internal(self, debit_confirmed: bool, confirmation_ref: str) -> "PayoutBuilder":
		self._funding = {"type": "INTERNAL", "debitConfirmed": debit_confirmed, "confirmationRef": confirmation_ref}
		return self

	def with_funding_from_card(self, receipt_id: str, status: str) -> "PayoutBuilder":
		self._funding = {"type": "AFT", "receiptId": receipt_id, "status": status}
		return self

	def with_funding_from_external(self, payment_id: str, status: str) -> "PayoutBuilder":
		self._funding = {"type": "PIS", "paymentId": payment_id, "status": status}
		return self

	def to_card_direct(self, pan_token: str) -> "PayoutBuilder":
		self._destination = {"type": "CARD", "panToken": pan_token}
		return self

	def to_account(self, account_id: str) -> "PayoutBuilder":
		self._destination = {"type": "ACCOUNT", "accountId": account_id}
		return self

	def to_wallet(self, wallet_id: str) -> "PayoutBuilder":
		self._destination = {"type": "WALLET", "walletId": wallet_id}
		return self

	def for_amount(self, currency: str, minor: int) -> "PayoutBuilder":
		self._amount = {"currency": currency, "minor": minor}
		return self

	def with_idempotency_key(self, key: str) -> "PayoutBuilder":
		self._idempotency_key = key
		return self

	def to_card_via_alias(self, alias: str, alias_type: str = "EMAIL") -> "PayoutBuilder":
		# Resolve alias to panToken
		http = SecureHttpClient()
		recipient_svc = RecipientService(http)
		resolved = recipient_svc.resolve_alias(alias, alias_type)
		self._destination = {"type": "CARD", "panToken": resolved["panToken"]}
		return self

	def with_quote_lock(self, src_currency: str, dst_currency: str) -> "PayoutBuilder":
		# Lock FX quote
		http = SecureHttpClient()
		quoting_svc = QuotingService(http)
		amount_minor = self._amount.get("minor", 0) if self._amount else 0
		quote = quoting_svc.lock(src_currency, dst_currency, amount_minor)
		self._quote_id = quote["quoteId"]
		self._quote_expires_at = quote["expiresAt"]
		return self

	def execute(self) -> Any:
		# FX policy enforcement
		if self._quote_id and self._quote_expires_at:
			expires = datetime.fromisoformat(self._quote_expires_at.replace('Z', '+00:00'))
			if expires < datetime.now(expires.tzinfo):
				raise QuoteExpiredError("Quote expired")
		
		# Mock policy: require quote for cross-border
		if self._amount and self._amount.get("currency") != "USD" and not self._quote_id:
			raise QuoteRequiredError("Quote required for cross-border payout")

		idem = self._idempotency_key or f"{__name__}-{id(self)}"
		req = {
			"originatorId": self._originator_id,
			"idempotencyKey": idem,
			"funding": self._funding,
			"destination": self._destination,
			"amount": self._amount,
		}
		return self._orch.payout(req)
