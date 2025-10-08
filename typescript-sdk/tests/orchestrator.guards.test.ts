import { Orchestrator, LedgerNotConfirmed } from '../src/core/orchestrator';
import { SecureHttpClient } from '../src/transport/secureHttpClient';

describe('Orchestrator guardrails', () => {
	const http = new SecureHttpClient({ baseUrl: process.env.VISA_BASE_URL });
	const orchestrator = new Orchestrator(http);

	it('throws LedgerNotConfirmed when internal funding lacks confirmation', async () => {
		await expect(orchestrator.payout({
			originatorId: 'fi-guard-1',
			idempotencyKey: 'guard-ledger-1',
			funding: { type: 'INTERNAL', debitConfirmed: false, confirmationRef: '' },
			destination: { type: 'CARD', panToken: 'tok_pan_411111******1111' },
			amount: { currency: 'USD', minor: 101 },
			preflight: {}
		})).rejects.toBeInstanceOf(LedgerNotConfirmed);
	});
});
