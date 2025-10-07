from flask import Flask, request, jsonify
from datetime import datetime
import hashlib


app = Flask(__name__)

# In-memory stores for idempotency and receipt reuse checks
IDEMPOTENCY_STORE = {}
PAYOUT_STATUS = {}
USED_RECEIPTS = set()
ALIAS_MAP = {}


def _idempotency_key():

	return request.headers.get("x-idempotency-key")


def _maybe_return_idempotent():

	key = _idempotency_key()
	if key and key in IDEMPOTENCY_STORE:

		return jsonify(IDEMPOTENCY_STORE[key])

	return None


def _store_idempotent(payload):

	key = _idempotency_key()
	if key:

		IDEMPOTENCY_STORE[key] = payload


def _is_odd_minor(amount_minor: int) -> bool:

	return (amount_minor % 2) == 1


def _extract_amount_minor(body: dict) -> int:

	amount = body.get("amount", {})
	return int(amount.get("minor", 0))


# ---------------------- Phase 2 support endpoints ----------------------

@app.route("/visaaliasdirectory/v1/resolve", methods=["POST"])
def alias_resolve():

	body = request.get_json(force=True, silent=True) or {}
	alias = body.get("alias")
	alias_type = body.get("aliasType", "EMAIL")
	if alias in ALIAS_MAP:

		mapped = ALIAS_MAP[alias]
	else:

		# deterministic token from alias
		mapped = {
			"credentialType": "CARD",
			"panToken": hashlib.sha256(alias.encode()).hexdigest()[:24]
		}
		ALIAS_MAP[alias] = mapped

	return jsonify({
		"alias": alias,
		"aliasType": alias_type,
		**mapped
	})


@app.route("/pav/v1/card/validation", methods=["POST"])  # PAV
def pav_validate():

	body = request.get_json(force=True, silent=True) or {}
	pan_token = body.get("panToken")
	# simple: tokens ending with '0' are bad
	good = not str(pan_token).endswith('0')
	return jsonify({ "cardStatus": "GOOD" if good else "BAD" })


@app.route("/paai/v1/fundstransfer/attributes/inquiry", methods=["POST"])  # FTAI
def ftai_inquiry():

	body = request.get_json(force=True, silent=True) or {}
	pan_token = body.get("panToken")
	oct_ok = not str(pan_token).endswith('9')
	return jsonify({ "octEligible": oct_ok, "reasonCodes": [] if oct_ok else ["NOT_ELIGIBLE"] })


@app.route("/visapayouts/v3/payouts/validate", methods=["POST"])  # payout validate for account/wallet
def payout_validate():

	body = request.get_json(force=True, silent=True) or {}
	return jsonify({ "valid": True, "warnings": [] })


@app.route("/forexrates/v1/lock", methods=["POST"])  # FX lock
def fx_lock():

	body = request.get_json(force=True, silent=True) or {}
	qid = "Q-" + hashlib.sha256((body.get("src") or "") .encode()).hexdigest()[:10]
	expires = datetime.utcnow().isoformat() + "Z"
	return jsonify({ "quoteId": qid, "expiresAt": expires })


@app.route("/visadirect/fundstransfer/v1/pullfunds", methods=["POST"])  # AFT / PIS inbound funding
def pullfunds():

	maybe = _maybe_return_idempotent()
	if maybe is not None:

		return maybe

	body = request.get_json(force=True, silent=True) or {}
	amount_minor = _extract_amount_minor(body)

	status = "approved" if _is_odd_minor(amount_minor) else "declined"
	receipt_id = hashlib.sha256(f"aft:{datetime.utcnow().isoformat()}:{amount_minor}".encode()).hexdigest()[:18]

	response = {
		"fundingType": body.get("fundingType", "AFT"),
		"status": status,
		"receiptId": receipt_id,
		"amount": body.get("amount", {}),
		"created": datetime.utcnow().isoformat() + "Z"
	}

	_store_idempotent(response)
	return jsonify(response)


@app.route("/visadirect/fundstransfer/v1/pushfunds", methods=["POST"])  # OCT card payout
def pushfunds():

	maybe = _maybe_return_idempotent()
	if maybe is not None:

		return maybe

	body = request.get_json(force=True, silent=True) or {}
	amount_minor = _extract_amount_minor(body)
	status = "executed" if _is_odd_minor(amount_minor) else "failed"
	payout_id = hashlib.sha256(f"oct:{datetime.utcnow().isoformat()}:{amount_minor}".encode()).hexdigest()[:24]

	payload = {
		"payoutId": payout_id,
		"status": status,
		"destination": "card",
		"amount": body.get("amount", {}),
		"created": datetime.utcnow().isoformat() + "Z"
	}

	PAYOUT_STATUS[payout_id] = payload
	_store_idempotent(payload)
	return jsonify(payload)


@app.route("/accountpayouts/v1/payout", methods=["POST"])  # Account payout
def account_payout():

	maybe = _maybe_return_idempotent()
	if maybe is not None:

		return maybe

	body = request.get_json(force=True, silent=True) or {}
	amount_minor = _extract_amount_minor(body)
	status = "executed" if _is_odd_minor(amount_minor) else "failed"
	payout_id = hashlib.sha256(f"acct:{datetime.utcnow().isoformat()}:{amount_minor}".encode()).hexdigest()[:24]

	payload = {
		"payoutId": payout_id,
		"status": status,
		"destination": "account",
		"amount": body.get("amount", {}),
		"created": datetime.utcnow().isoformat() + "Z"
	}

	PAYOUT_STATUS[payout_id] = payload
	_store_idempotent(payload)
	return jsonify(payload)


@app.route("/walletpayouts/v1/payout", methods=["POST"])  # Wallet payout
def wallet_payout():

	maybe = _maybe_return_idempotent()
	if maybe is not None:

		return maybe

	body = request.get_json(force=True, silent=True) or {}
	amount_minor = _extract_amount_minor(body)
	status = "executed" if _is_odd_minor(amount_minor) else "failed"
	payout_id = hashlib.sha256(f"wallet:{datetime.utcnow().isoformat()}:{amount_minor}".encode()).hexdigest()[:24]

	payload = {
		"payoutId": payout_id,
		"status": status,
		"destination": "wallet",
		"amount": body.get("amount", {}),
		"created": datetime.utcnow().isoformat() + "Z"
	}

	PAYOUT_STATUS[payout_id] = payload
	_store_idempotent(payload)
	return jsonify(payload)


@app.route("/visapayouts/v3/payouts/<payout_id>", methods=["GET"])  # status
def payout_status(payout_id):

	if payout_id in PAYOUT_STATUS:

		return jsonify(PAYOUT_STATUS[payout_id])

	return jsonify({"payoutId": payout_id, "status": "unknown"}), 404


if __name__ == "__main__":

	app.run(host="127.0.0.1", port=8766)
