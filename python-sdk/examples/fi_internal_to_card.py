from visa_direct_sdk.dx.builder import PayoutBuilder


def main():
	builder = PayoutBuilder.create()
	res = builder \
		.for_originator("fi-001") \
		.with_funding_internal(True, "conf-123") \
		.to_card_direct("tok_pan_411111******1111") \
		.for_amount("USD", 101) \
		.with_idempotency_key("py-demo-internal-card-1") \
		.execute()
	print({"status": res.get("status"), "payoutId": res.get("payoutId")})


if __name__ == "__main__":
	main()
