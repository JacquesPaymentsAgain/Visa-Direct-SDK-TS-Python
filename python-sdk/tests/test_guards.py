import os
import pytest

from visa_direct_sdk.core.orchestrator import Orchestrator, LedgerNotConfirmed
from visa_direct_sdk.transport.secure_http_client import SecureHttpClient

os.environ.setdefault("VISA_BASE_URL", "http://127.0.0.1:8766")
os.environ.setdefault("SDK_ENV", "dev")


def make_orchestrator() -> Orchestrator:
	http = SecureHttpClient(base_url=os.environ["VISA_BASE_URL"])
	return Orchestrator(http)


def test_internal_funding_requires_debit_confirmation() -> None:
	orch = make_orchestrator()
	with pytest.raises(LedgerNotConfirmed):
		orch.payout({
			"originatorId": "fi-guard-1",
			"idempotencyKey": "py-ledger-1",
			"funding": {"type": "INTERNAL", "debitConfirmed": False, "confirmationRef": ""},
			"destination": {"type": "CARD", "panToken": "tok_pan_411111******1111"},
			"amount": {"currency": "USD", "minor": 101},
		})
