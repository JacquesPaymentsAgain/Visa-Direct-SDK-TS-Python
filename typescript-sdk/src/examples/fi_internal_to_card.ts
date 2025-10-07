import { PayoutBuilder } from '../dx/builder';

async function main() {
	const builder = PayoutBuilder.create();
	const res = await builder
		.forOriginator('fi-001')
		.withFundingInternal(true, 'conf-123')
		.toCardDirect('tok_pan_411111******1111')
		.forAmount('USD', 101) // odd -> executed
		.withIdempotencyKey('demo-internal-card-1')
		.execute();
	console.log('Payout result:', { status: res.status, payoutId: res.payoutId });
}

main().catch(err => { console.error(err); process.exit(1); });
