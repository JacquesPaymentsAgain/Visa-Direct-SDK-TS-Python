import { SecureHttpClient } from '../transport/secureHttpClient';
import { IdempotencyStore, InMemoryIdempotencyStore } from '../storage/idempotencyStore';
import { InMemoryReceiptStore, ReceiptStore } from '../storage/receiptStore';
import { LogEmitter, CompensationEventEmitter } from '../utils/events';

export type FundingInternal = { type: 'INTERNAL'; debitConfirmed: boolean; confirmationRef: string };
export type FundingAft = { type: 'AFT'; receiptId: string; status: 'approved' | 'declined' };
export type FundingPis = { type: 'PIS'; paymentId: string; status: 'executed' | 'failed' };
export type Funding = FundingInternal | FundingAft | FundingPis;

export type DestinationCard = { type: 'CARD'; panToken: string };
export type DestinationAccount = { type: 'ACCOUNT'; accountId: string };
export type DestinationWallet = { type: 'WALLET'; walletId: string };
export type Destination = DestinationCard | DestinationAccount | DestinationWallet;

export type Amount = { currency: string; minor: number };

export type PayoutRequest = {
	originatorId: string;
	idempotencyKey: string;
	funding: Funding;
	destination: Destination;
	amount: Amount;
};

export class LedgerNotConfirmed extends Error {}
export class AFTDeclined extends Error {}
export class PISFailed extends Error {}
export class ReceiptReused extends Error {}

const DEFAULT_IDEM_TTL_SECONDS = 3600;

export class Orchestrator {
	constructor(
		private http: SecureHttpClient,
		private idempotencyStore: IdempotencyStore<any> = new InMemoryIdempotencyStore<any>(),
		private receiptStore: ReceiptStore = new InMemoryReceiptStore(),
		private events: CompensationEventEmitter = new LogEmitter()
	) {}

	async payout(req: PayoutRequest): Promise<any> {
		const cached = this.idempotencyStore.get(req.idempotencyKey);
		if (cached) return cached;

		// Guards
		if (req.funding.type === 'INTERNAL') {
			if (!req.funding.debitConfirmed || !req.funding.confirmationRef) {
				throw new LedgerNotConfirmed('Internal ledger debit not confirmed');
			}
		} else if (req.funding.type === 'AFT') {
			if (!this.receiptStore.consumeOnce('AFT', req.funding.receiptId)) {
				throw new ReceiptReused('AFT receipt already used');
			}
			if (req.funding.status !== 'approved') {
				throw new AFTDeclined('AFT not approved');
			}
		} else if (req.funding.type === 'PIS') {
			if (!this.receiptStore.consumeOnce('PIS', req.funding.paymentId)) {
				throw new ReceiptReused('PIS payment already used');
			}
			if (req.funding.status !== 'executed') {
				throw new PISFailed('PIS not executed');
			}
		}

		// Dispatch
		let path = '';
		if (req.destination.type === 'CARD') path = '/visadirect/fundstransfer/v1/pushfunds';
		else if (req.destination.type === 'ACCOUNT') path = '/accountpayouts/v1/payout';
		else if (req.destination.type === 'WALLET') path = '/walletpayouts/v1/payout';

		const headers = { 'x-idempotency-key': req.idempotencyKey } as any;
		try {
			const { data } = await this.http.post(path, {
			originatorId: req.originatorId,
			funding: req.funding,
			destination: req.destination,
			amount: req.amount
		}, { headers });
			this.idempotencyStore.put(req.idempotencyKey, data, DEFAULT_IDEM_TTL_SECONDS);
			return data;
		} catch (e: any) {
			await this.events.emit({
				event: 'payout_failed_requires_compensation',
				sagaId: req.idempotencyKey,
				funding: req.funding,
				reason: 'NetworkError',
				metadata: { message: e?.message },
				timestamp: new Date().toISOString()
			});
			throw e;
		}
	}
}
