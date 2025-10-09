import { Span } from '@opentelemetry/api';
import { SecureHttpClient } from '../transport/secureHttpClient';
import { IdempotencyStore, InMemoryIdempotencyStore } from '../storage/idempotencyStore';
import { InMemoryReceiptStore, ReceiptStore } from '../storage/receiptStore';
import { LogEmitter, CompensationEventEmitter } from '../utils/events';
import { RecipientService } from '../services/recipientService';
import { QuotingService } from '../services/quotingService';
import { ComplianceService, ComplianceConfig } from '../services/complianceService';
import { DestinationNotAllowedError, QuoteExpiredError, QuoteRequiredError } from '../types/errors';
import { withSpan } from '../utils/otel';
import { CorridorIdentifier, CorridorRules, Policy, getRules, loadPolicy } from '../policy/corridorPolicy';

export type FundingInternal = { type: 'INTERNAL'; debitConfirmed: boolean; confirmationRef: string };
export type FundingAft = { type: 'AFT'; receiptId: string; status: 'approved' | 'declined' };
export type FundingPis = { type: 'PIS'; paymentId: string; status: 'executed' | 'failed' };
export type Funding = FundingInternal | FundingAft | FundingPis;

export type DestinationCard = { type: 'CARD'; panToken: string };
export type DestinationAccount = { type: 'ACCOUNT'; accountId: string };
export type DestinationWallet = { type: 'WALLET'; walletId: string };
export type DestinationAlias = { type: 'ALIAS'; alias: string; aliasType: string };
export type Destination = DestinationCard | DestinationAccount | DestinationWallet | DestinationAlias;

export type Amount = { currency: string; minor: number };

export type PreflightConfig = {
	alias?: { alias: string; aliasType: string };
	fxLock?: { srcCurrency: string; dstCurrency: string; amountMinor: number };
	compliancePayload?: any;
	corridor?: CorridorIdentifier;
};

export type PayoutRequest = {
	originatorId: string;
	idempotencyKey: string;
	funding: Funding;
	destination: Destination;
	amount: Amount;
	preflight?: PreflightConfig;
};

export class LedgerNotConfirmed extends Error {}
export class AFTDeclined extends Error {}
export class PISFailed extends Error {}
export class ReceiptReused extends Error {}

const DEFAULT_IDEM_TTL_SECONDS = 3600;

export type OrchestratorOptions = {
	idempotencyStore?: IdempotencyStore<any>;
	receiptStore?: ReceiptStore;
	events?: CompensationEventEmitter;
	recipientService?: RecipientService;
	quotingService?: QuotingService;
	complianceService?: ComplianceService;
	complianceConfig?: ComplianceConfig;
};

export class Orchestrator {
	private idempotencyStore: IdempotencyStore<any>;
	private receiptStore: ReceiptStore;
	private events: CompensationEventEmitter;
	private recipientService: RecipientService;
	private quotingService: QuotingService;
	private complianceService: ComplianceService;
	private corridorPolicy?: Policy;

	constructor(
		public httpClient: SecureHttpClient,
		options: OrchestratorOptions = {}
	) {
		this.idempotencyStore = options.idempotencyStore ?? new InMemoryIdempotencyStore<any>();
		this.receiptStore = options.receiptStore ?? new InMemoryReceiptStore();
		this.events = options.events ?? new LogEmitter();
		this.recipientService = options.recipientService ?? new RecipientService(httpClient);
		this.quotingService = options.quotingService ?? new QuotingService(httpClient);
		this.complianceService = options.complianceService ?? new ComplianceService(httpClient, {
			mode: 'cross-border-only',
			enabled: true,
			denyPath: '/compliance/v1/deny'
		});
	}

	async payout(req: PayoutRequest): Promise<any> {
		return withSpan('orchestrator.payout', async (span) => {
			span?.setAttributes({
				'visa.destination.type': req.destination.type,
				'visa.amount.currency': req.amount?.currency,
				'visa.fx.lock_hint': !!req.preflight?.fxLock
			});

			const cached = await this.idempotencyStore.get(req.idempotencyKey);
			if (cached) {
				span?.addEvent('idempotency.hit');
				return cached;
			}

			await withSpan('orchestrator.guards', async () => {
				if (req.funding.type === 'INTERNAL') {
					if (!req.funding.debitConfirmed || !req.funding.confirmationRef) {
						throw new LedgerNotConfirmed('Internal ledger debit not confirmed');
					}
				} else if (req.funding.type === 'AFT') {
					if (!await this.receiptStore.consumeOnce('AFT', req.funding.receiptId)) {
						throw new ReceiptReused('AFT receipt already used');
					}
					if (req.funding.status !== 'approved') {
						throw new AFTDeclined('AFT not approved');
					}
				} else if (req.funding.type === 'PIS') {
					if (!await this.receiptStore.consumeOnce('PIS', req.funding.paymentId)) {
						throw new ReceiptReused('PIS payment already used');
					}
					if (req.funding.status !== 'executed') {
						throw new PISFailed('PIS not executed');
					}
				}
			}, { attributes: { 'visa.funding.type': req.funding.type } });

			// Compliance checks
			await withSpan('orchestrator.compliance', async (complianceSpan) => {
				const complianceResult = await this.complianceService.checkCompliance({
					sourceCountry: req.preflight?.corridor?.sourceCountry || 'US',
					targetCountry: req.preflight?.corridor?.targetCountry || 'US',
					amount: req.amount.minor,
					currency: req.amount.currency,
					originatorId: req.originatorId,
					recipientId: req.destination.type === 'CARD' ? req.destination.panToken : 
								 req.destination.type === 'ACCOUNT' ? req.destination.accountId :
								 req.destination.type === 'WALLET' ? req.destination.walletId : 'unknown',
					correlationId: span?.spanContext().traceId
				});

				complianceSpan?.setAttributes({
					'visa.compliance.allowed': complianceResult.allowed,
					'visa.compliance.reason': complianceResult.reason || 'none',
					'visa.compliance.id': complianceResult.complianceId || 'none'
				});

				if (!complianceResult.allowed) {
					const error = new Error(`Compliance check failed: ${complianceResult.reason}`);
					error.name = 'ComplianceDenied';
					throw error;
				}
			}, { attributes: { 'visa.compliance.enabled': true } });

			const { destination, fxQuoteId } = await this.runPreflight(req, span);

			// Dispatch
			let path = '';
			if (destination.type === 'CARD') path = '/visadirect/fundstransfer/v1/pushfunds';
			else if (destination.type === 'ACCOUNT') path = '/accountpayouts/v1/payout';
			else if (destination.type === 'WALLET') path = '/walletpayouts/v1/payout';
			else throw new Error('Unsupported destination after preflight');

			const headers = { 'x-idempotency-key': req.idempotencyKey } as any;
			try {
				const { data } = await this.httpClient.post(path, {
					originatorId: req.originatorId,
					funding: req.funding,
					destination,
					amount: req.amount,
					fxQuoteId
				}, { headers });
				await this.idempotencyStore.put(req.idempotencyKey, data, DEFAULT_IDEM_TTL_SECONDS);
				return data;
			} catch (e: any) {
				span?.addEvent('orchestrator.compensation_emitted');
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
		}, {
			attributes: {
				'visa.idempotency.key_present': !!req.idempotencyKey
			}
		});
	}

	private async runPreflight(req: PayoutRequest, parentSpan?: Span): Promise<{ destination: DestinationCard | DestinationAccount | DestinationWallet; fxQuoteId?: string }> {
		const originalDestination = req.destination;
		let resolvedDestination: DestinationCard | DestinationAccount | DestinationWallet | undefined;

		if (originalDestination.type === 'ALIAS') {
			await withSpan('orchestrator.preflight.alias', async () => {
				const aliasResult = await this.recipientService.resolveAlias(originalDestination.alias, originalDestination.aliasType);
				await this.recipientService.pav(aliasResult.panToken);
				const ftai = await this.recipientService.ftai(aliasResult.panToken);
				if (ftai?.octEligible === false) {
					throw new Error('Destination panToken not OCT eligible');
				}
				resolvedDestination = { type: 'CARD', panToken: aliasResult.panToken };
			}, { attributes: { 'visa.alias.type': originalDestination.aliasType } });
		} else {
			resolvedDestination = originalDestination;
		}
		if (!resolvedDestination) {
			throw new Error('Unable to resolve destination after preflight');
		}

		if (req.preflight?.compliancePayload) {
			await withSpan('orchestrator.preflight.compliance', async () => {
				const result = await this.complianceService.checkCompliance({
					sourceCountry: req.preflight?.corridor?.sourceCountry || 'US',
					targetCountry: req.preflight?.corridor?.targetCountry || 'US',
					amount: req.amount.minor,
					currency: req.amount.currency,
					originatorId: req.originatorId,
					recipientId: 'preflight-check',
					correlationId: undefined
				});
				if (!result.allowed) {
					throw new Error(`Compliance screening failed: ${result.reason}`);
				}
			});
		}

		let fxQuoteId: string | undefined;
		if (req.preflight?.fxLock) {
			await withSpan('orchestrator.preflight.fx', async () => {
				const amountMinor = req.preflight?.fxLock?.amountMinor ?? req.amount.minor;
				const quote = await this.quotingService.lock(req.preflight!.fxLock!.srcCurrency, req.preflight!.fxLock!.dstCurrency, amountMinor);
				const expires = new Date(quote.expiresAt);
				if (expires.getTime() <= Date.now()) {
					throw new QuoteExpiredError('Quote expired');
				}
				fxQuoteId = quote.quoteId;
			}, { attributes: { 'visa.fx.src': req.preflight.fxLock.srcCurrency, 'visa.fx.dst': req.preflight.fxLock.dstCurrency } });
		} else if (this.requiresQuoteFor(req)) {
			throw new QuoteRequiredError('Quote required for cross-border payout');
		}

		parentSpan?.setAttribute('visa.destination.final_type', resolvedDestination.type);

		const rules = this.resolveCorridorRules(req.preflight?.corridor);
		if (rules) {
			if (rules.rails?.allowedDestinations) {
				const destType = this.mapDestinationType(resolvedDestination.type);
				if (!rules.rails.allowedDestinations.includes(destType)) {
					throw new DestinationNotAllowedError(`Destination ${destType} not permitted for corridor ${(req.preflight?.corridor?.sourceCountry) ?? '?'}->${(req.preflight?.corridor?.targetCountry) ?? '?'}`);
				}
			}
			if (rules.fx?.lockRequired && !fxQuoteId) {
				throw new QuoteRequiredError('FX quote required by corridor policy');
			}
		}

		return { destination: resolvedDestination, fxQuoteId };
	}

	private requiresQuoteFor(req: PayoutRequest): boolean {
		// Placeholder: treat non-USD payouts as cross-border until corridor policy is introduced
		const currency = req.amount?.currency;
		if (!currency) return false;
		if (currency === 'USD') return false;
		return true;
	}

	private resolveCorridorRules(corridor?: CorridorIdentifier): CorridorRules | undefined {
		if (!corridor) return undefined;
		if (!this.corridorPolicy) {
			this.corridorPolicy = loadPolicy();
		}
		return getRules(this.corridorPolicy, corridor);
	}

	private mapDestinationType(type: Destination['type']): 'card' | 'account' | 'wallet' {
		if (type === 'CARD') return 'card';
		if (type === 'ACCOUNT') return 'account';
		if (type === 'WALLET') return 'wallet';
		throw new DestinationNotAllowedError(`Unsupported destination type ${type}`);
	}
}
