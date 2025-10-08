import { Orchestrator } from '../core/orchestrator';
import { SecureHttpClient } from '../transport/secureHttpClient';
import { InMemoryIdempotencyStore } from '../storage/idempotencyStore';
import { InMemoryReceiptStore } from '../storage/receiptStore';

async function main() {
	const http = new SecureHttpClient({});
	const sharedIdem = new InMemoryIdempotencyStore<any>();
	const sharedReceipts = new InMemoryReceiptStore();

	const options = { idempotencyStore: sharedIdem, receiptStore: sharedReceipts };
	const orchA = new Orchestrator(http, options);
	const orchB = new Orchestrator(http, options);

	const reqBase = {
		originatorId: 'fi-001',
		amount: { currency: 'USD', minor: 101 },
		destination: { type: 'CARD' as const, panToken: 'tok_pan_411111******1111' }
	};

	// Idempotency: same key across two orchestrators returns same result without duplicate network effect
	const idemKey = 'kv-idem-1';
	const r1 = await orchA.payout({ ...reqBase, idempotencyKey: idemKey, funding: { type: 'INTERNAL', debitConfirmed: true, confirmationRef: 'conf-1' } });
	const r2 = await orchB.payout({ ...reqBase, idempotencyKey: idemKey, funding: { type: 'INTERNAL', debitConfirmed: true, confirmationRef: 'conf-1' } });
	console.log('idempotentSame:', r1.payoutId === r2.payoutId);

	// Receipt reuse across instances
	const receiptId = 'shared-receipt-1';
	await orchA.payout({ ...reqBase, idempotencyKey: 'kv-reuse-ok', funding: { type: 'AFT', receiptId, status: 'approved' } });
	let reuseError = '';
	try {
		await orchB.payout({ ...reqBase, idempotencyKey: 'kv-reuse-fail', funding: { type: 'AFT', receiptId, status: 'approved' } });
	} catch (e: any) { reuseError = e?.constructor?.name || 'Error'; }
	console.log('receiptReuseBlocked:', reuseError);
}

main().catch(e => { console.error(e); process.exit(1); });

