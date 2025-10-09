import * as fs from 'fs';
import * as path from 'path';

const embeddedPolicyJson = require('./corridor-policy.default.json');

export type CorridorRules = {
	fx?: { lockRequired?: boolean; slippageBpsMax?: number };
	compliance?: { scope?: 'all' | 'cross-border-only' };
	rails?: { allowedDestinations?: Array<'card' | 'account' | 'wallet'>; fallbacks?: Array<'card' | 'account' | 'wallet'> };
	limits?: { maxValueMinor?: number; dailyCountMax?: number };
	sla?: { etaSeconds?: number };
};

export type Corridor = {
	sourceCountry: string;
	targetCountry: string;
	currencies?: { source?: string; target?: string };
	rules: CorridorRules;
};

export type Policy = { version: string; corridors: Corridor[] };

export type CorridorIdentifier = {
	sourceCountry: string;
	targetCountry: string;
	sourceCurrency?: string;
	targetCurrency?: string;
};

export class PolicyNotFoundError extends Error {}

type LoadPolicyOptions = string | { file?: string; policy?: Policy } | undefined;

let cachedPolicy: Policy | undefined;

const EMBEDDED_POLICY = embeddedPolicyJson as Policy;

export function loadPolicy(options?: LoadPolicyOptions): Policy {
	const resolved = typeof options === 'string' ? { file: options } : (options ?? {});
	if (resolved.policy) {
		return resolved.policy;
	}
	if (resolved.file) {
		const candidate = path.resolve(resolved.file);
		if (!fs.existsSync(candidate)) {
			throw new PolicyNotFoundError(`Corridor policy file not found at ${candidate}`);
		}
		const raw = fs.readFileSync(candidate, 'utf8');
		return JSON.parse(raw) as Policy;
	}
	if (!cachedPolicy) {
		cachedPolicy = EMBEDDED_POLICY;
	}
	return cachedPolicy;
}

export function clearPolicyCache(): void {
	cachedPolicy = undefined;
}

export function getRules(policy: Policy, corridor: CorridorIdentifier): CorridorRules {
	const match = policy.corridors.find((entry) => {
		if (entry.sourceCountry !== corridor.sourceCountry) return false;
		if (entry.targetCountry !== corridor.targetCountry) return false;
		if (!entry.currencies) return true;
		const sourceOk = entry.currencies.source ? entry.currencies.source === corridor.sourceCurrency : true;
		const targetOk = entry.currencies.target ? entry.currencies.target === corridor.targetCurrency : true;
		return sourceOk && targetOk;
	});

	if (!match) {
		throw new PolicyNotFoundError(`No corridor policy for ${corridor.sourceCountry}->${corridor.targetCountry}`);
	}

	return match.rules ?? {};
}
