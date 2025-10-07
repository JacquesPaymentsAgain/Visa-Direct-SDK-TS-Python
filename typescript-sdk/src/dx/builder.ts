import { Orchestrator, PayoutRequest, Funding, Destination, Amount } from '../core/orchestrator';
import { SecureHttpClient } from '../transport/secureHttpClient';
import { RecipientService } from '../services/recipientService';
import { QuotingService } from '../services/quotingService';
import { QuoteExpiredError, QuoteRequiredError } from '../types/errors';

export class PayoutBuilder {
	private originatorId?: string;
	private funding?: Funding;
	private destination?: Destination;
	private amount?: Amount;
	private idempotencyKey?: string;
	private quoteId?: string;
	private quoteExpiresAt?: string;
	private compliancePayload?: any;

	constructor(private orchestrator: Orchestrator) {}

	static create(http?: SecureHttpClient) {
		return new PayoutBuilder(new Orchestrator(http ?? new SecureHttpClient({})));
	}

	forOriginator(originatorId: string) { this.originatorId = originatorId; return this; }
	withFundingInternal(debitConfirmed: boolean, confirmationRef: string) { this.funding = { type: 'INTERNAL', debitConfirmed, confirmationRef }; return this; }
	withFundingFromCard(receiptId: string, status: 'approved' | 'declined') { this.funding = { type: 'AFT', receiptId, status }; return this; }
	withFundingFromExternal(paymentId: string, status: 'executed' | 'failed') { this.funding = { type: 'PIS', paymentId, status }; return this; }
	toCardDirect(panToken: string) { this.destination = { type: 'CARD', panToken }; return this; }
	toAccount(accountId: string) { this.destination = { type: 'ACCOUNT', accountId }; return this; }
	toWallet(walletId: string) { this.destination = { type: 'WALLET', walletId }; return this; }
	forAmount(currency: string, minor: number) { this.amount = { currency, minor }; return this; }
	withIdempotencyKey(key: string) { this.idempotencyKey = key; return this; }
	async toCardViaAlias(args: { alias: string; aliasType: string }) { const svc = new RecipientService(new SecureHttpClient({})); const r = await svc.resolveAlias(args.alias, args.aliasType); this.destination = { type: 'CARD', panToken: r.panToken }; return this; }
	async withQuoteLock(args: { srcCurrency: string; dstCurrency: string; amountMinor?: number }) { const svc = new QuotingService(new SecureHttpClient({})); const amountMinor = args.amountMinor ?? this.amount?.minor ?? 0; const q = await svc.lock(args.srcCurrency, args.dstCurrency, amountMinor); this.quoteId = q.quoteId; this.quoteExpiresAt = q.expiresAt; return this; }
	withCompliance(payload: any) { this.compliancePayload = payload; return this; }

	async execute(): Promise<any> {
		// FX policy: require lock for cross-border (simple mock: non-USD)
		if (this.amount?.currency && this.amount.currency !== 'USD') {
			if (!this.quoteId) throw new QuoteRequiredError('Quote required for cross-border payout');
			if (this.quoteExpiresAt) {
				const expires = new Date(this.quoteExpiresAt);
				if (expires.getTime() < Date.now()) throw new QuoteExpiredError('Quote expired');
			}
		}
		const idempo = this.idempotencyKey ?? `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
		const req: PayoutRequest = {
			originatorId: this.originatorId!,
			idempotencyKey: idempo,
			funding: this.funding!,
			destination: this.destination!,
			amount: this.amount!
		};
		return this.orchestrator.payout(req);
	}
}
