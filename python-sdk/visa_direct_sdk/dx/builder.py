from typing import Any, Dict, Optional

from ..core.orchestrator import Orchestrator
from ..errors import DestinationNotAllowedError, QuoteRequiredError
from ..policy.corridor_policy import get_rules, load_policy
from ..transport.secure_http_client import SecureHttpClient


class PayoutBuilder:

	def __init__(self, orchestrator: Orchestrator) -> None:
		self._orch = orchestrator
		self._originator_id: Optional[str] = None
		self._funding: Optional[Dict[str, Any]] = None
		self._destination: Optional[Dict[str, Any]] = None
		self._amount: Optional[Dict[str, Any]] = None
		self._idempotency_key: Optional[str] = None
		self._preflight: Dict[str, Any] = {}

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
		self._preflight.pop("alias", None)
		return self

	def to_account(self, account_id: str) -> "PayoutBuilder":
		self._destination = {"type": "ACCOUNT", "accountId": account_id}
		self._preflight.pop("alias", None)
		return self

	def to_wallet(self, wallet_id: str) -> "PayoutBuilder":
		self._destination = {"type": "WALLET", "walletId": wallet_id}
		self._preflight.pop("alias", None)
		return self

	def for_amount(self, currency: str, minor: int) -> "PayoutBuilder":
		self._amount = {"currency": currency, "minor": minor}
		return self

	def with_idempotency_key(self, key: str) -> "PayoutBuilder":
		self._idempotency_key = key
		return self

	def to_card_via_alias(self, alias: str, alias_type: str = "EMAIL") -> "PayoutBuilder":
		self._destination = {"type": "ALIAS", "alias": alias, "aliasType": alias_type}
		self._preflight["alias"] = {"alias": alias, "aliasType": alias_type}
		return self

	def with_quote_lock(self, src_currency: str, dst_currency: str) -> "PayoutBuilder":
		amount_minor = self._amount.get("minor", 0) if self._amount else 0
		self._preflight["fxLock"] = {
			"srcCurrency": src_currency,
			"dstCurrency": dst_currency,
			"amountMinor": amount_minor,
		}
		return self

	def with_compliance(self, payload: Dict[str, Any]) -> "PayoutBuilder":
		self._preflight["compliancePayload"] = payload
		return self

	def for_corridor(
		self,
		source_country: str,
		target_country: str,
		*,
		source_currency: Optional[str] = None,
		target_currency: Optional[str] = None,
	) -> "PayoutBuilder":
		self._preflight["corridor"] = {
			"sourceCountry": source_country,
			"targetCountry": target_country,
			"sourceCurrency": source_currency or self._preflight.get("corridor", {}).get("sourceCurrency"),
			"targetCurrency": target_currency or self._preflight.get("corridor", {}).get("targetCurrency"),
		}
		return self

	def execute(self) -> Any:
		if "fxLock" in self._preflight and self._amount and "minor" in self._amount:
			self._preflight["fxLock"]["amountMinor"] = self._amount["minor"]
		if "corridor" in self._preflight:
			corridor = self._preflight["corridor"]
			if not corridor.get("sourceCurrency") and "fxLock" in self._preflight:
				corridor["sourceCurrency"] = self._preflight["fxLock"].get("srcCurrency")
			if not corridor.get("targetCurrency") and self._amount:
				corridor["targetCurrency"] = self._amount.get("currency")
			self._enforce_corridor_policy()
		idem = self._idempotency_key or f"{__name__}-{id(self)}"
		req = {
			"originatorId": self._originator_id,
			"idempotencyKey": idem,
			"funding": self._funding,
			"destination": self._destination,
			"amount": self._amount,
			"preflight": self._preflight,
		}
		return self._orch.payout(req)

	def _enforce_corridor_policy(self) -> None:
		corridor = self._preflight.get("corridor")
		if not corridor:
			return
		policy = load_policy()
		rules = get_rules(
			policy,
			source_country=corridor["sourceCountry"],
			target_country=corridor["targetCountry"],
			source_currency=corridor.get("sourceCurrency"),
			target_currency=corridor.get("targetCurrency"),
		)
		if rules.fx and rules.fx.get("lockRequired") and "fxLock" not in self._preflight:
			raise QuoteRequiredError("FX quote required by corridor policy")
		if rules.rails and rules.rails.get("allowedDestinations"):
			dest_type = self._policy_destination_type()
			if dest_type not in rules.rails["allowedDestinations"]:
				raise DestinationNotAllowedError(
					f"Destination {dest_type} not permitted for corridor {corridor['sourceCountry']}->{corridor['targetCountry']}"
				)

	def _policy_destination_type(self) -> str:
		if not self._destination:
			raise DestinationNotAllowedError("Destination required before corridor policy enforcement")
		dtype = self._destination.get("type")
		if dtype == "ALIAS":
			return "card"
		if dtype in ("CARD", "ACCOUNT", "WALLET"):
			return dtype.lower()
		raise DestinationNotAllowedError(f"Unsupported destination type {dtype}")
