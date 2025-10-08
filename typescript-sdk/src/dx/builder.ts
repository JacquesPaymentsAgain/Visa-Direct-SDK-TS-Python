import { Orchestrator, PayoutRequest, Funding, Destination, Amount, PreflightConfig } from '../core/orchestrator';
import { QuoteRequiredError, DestinationNotAllowedError } from '../types/errors';
import { SecureHttpClient } from '../transport/secureHttpClient';
import { getRules, loadPolicy, CorridorRules } from '../policy/corridorPolicy';

export class PayoutBuilder {
	private originatorId?: string;
	private funding?: Funding;
	private destination?: Destination;
	private amount?: Amount;
	private idempotencyKey?: string;
	private preflight: PreflightConfig = {};

	constructor(private orchestrator: Orchestrator) {}

	static create(http?: SecureHttpClient) {
		const client = http ?? new SecureHttpClient({});
		return new PayoutBuilder(new Orchestrator(client));
	}

	forOriginator(originatorId: string) { this.originatorId = originatorId; return this; }
	withFundingInternal(debitConfirmed: boolean, confirmationRef: string) { this.funding = { type: 'INTERNAL', debitConfirmed, confirmationRef }; return this; }
	withFundingFromCard(receiptId: string, status: 'approved' | 'declined') { this.funding = { type: 'AFT', receiptId, status }; return this; }
	withFundingFromExternal(paymentId: string, status: 'executed' | 'failed') { this.funding = { type: 'PIS', paymentId, status }; return this; }
	toCardDirect(panToken: string) { this.destination = { type: 'CARD', panToken }; delete this.preflight.alias; return this; }
	toAccount(accountId: string) { this.destination = { type: 'ACCOUNT', accountId }; delete this.preflight.alias; return this; }
	toWallet(walletId: string) { this.destination = { type: 'WALLET', walletId }; delete this.preflight.alias; return this; }
	forAmount(currency: string, minor: number) { this.amount = { currency, minor }; return this; }
	withIdempotencyKey(key: string) { this.idempotencyKey = key; return this; }
	toCardViaAlias(args: { alias: string; aliasType: string }) {
		this.destination = { type: 'ALIAS', alias: args.alias, aliasType: args.aliasType };
		this.preflight.alias = { alias: args.alias, aliasType: args.aliasType };
		return this;
	}
	withQuoteLock(args: { srcCurrency: string; dstCurrency: string; amountMinor?: number }) {
		const amountMinor = args.amountMinor ?? this.amount?.minor ?? 0;
		this.preflight.fxLock = {
			srcCurrency: args.srcCurrency,
			dstCurrency: args.dstCurrency,
			amountMinor
		};
		return this;
	}
	forCorridor(sourceCountry: string, targetCountry: string, currencies?: { sourceCurrency?: string; targetCurrency?: string }) {
		this.preflight.corridor = {
			sourceCountry,
			targetCountry,
			sourceCurrency: currencies?.sourceCurrency ?? this.preflight.corridor?.sourceCurrency,
			targetCurrency: currencies?.targetCurrency ?? this.preflight.corridor?.targetCurrency
		};
		return this;
	}
	withCompliance(payload: any) { this.preflight.compliancePayload = payload; return this; }

	async execute(): Promise<any> {
		if (this.preflight.fxLock && this.amount?.minor !== undefined) {
			this.preflight.fxLock.amountMinor = this.amount.minor;
		}
		if (this.preflight.corridor) {
			if (!this.preflight.corridor.sourceCurrency && this.preflight.fxLock?.srcCurrency) {
				this.preflight.corridor.sourceCurrency = this.preflight.fxLock.srcCurrency;
			}
			if (!this.preflight.corridor.targetCurrency && this.amount?.currency) {
				this.preflight.corridor.targetCurrency = this.amount.currency;
			}
			this.ensureCorridorCompliance();
		}
		const idempo = this.idempotencyKey ?? `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
		const req: PayoutRequest = {
			originatorId: this.originatorId!,
			idempotencyKey: idempo,
			funding: this.funding!,
			destination: this.destination!,
			amount: this.amount!,
			preflight: this.preflight
		};
		return this.orchestrator.payout(req);
	}

	private ensureCorridorCompliance(): CorridorRules | undefined {
		if (!this.preflight.corridor) return undefined;
		const policy = loadPolicy();
		const rules = getRules(policy, this.preflight.corridor);

		if (rules.fx?.lockRequired && !this.preflight.fxLock) {
			throw new QuoteRequiredError('FX quote required by corridor policy');
		}

		if (rules.rails?.allowedDestinations) {
			const destinationType = this.getPolicyDestinationType();
			if (!rules.rails.allowedDestinations.includes(destinationType)) {
				throw new DestinationNotAllowedError(`Destination ${destinationType} not permitted for corridor ${this.preflight.corridor.sourceCountry}->${this.preflight.corridor.targetCountry}`);
			}
		}

		return rules;
	}

	private getPolicyDestinationType(): 'card' | 'account' | 'wallet' {
		if (!this.destination) throw new Error('Destination required before corridor policy enforcement');
		const type = this.destination.type === 'ALIAS' ? 'CARD' : this.destination.type;
		if (type === 'CARD') return 'card';
		if (type === 'ACCOUNT') return 'account';
		if (type === 'WALLET') return 'wallet';
		throw new DestinationNotAllowedError(`Unsupported destination type ${type}`);
	}
}
