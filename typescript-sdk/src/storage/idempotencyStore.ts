export interface IdempotencyStore<T = any> {
	get(idempotencyKey: string): T | undefined;
	put(idempotencyKey: string, value: T, ttlSeconds: number): void;
}

export class InMemoryIdempotencyStore<T = any> implements IdempotencyStore<T> {
	private store = new Map<string, { value: T; expiresAt: number }>();
	get(idempotencyKey: string): T | undefined {
		const e = this.store.get(idempotencyKey);
		if (!e) return undefined;
		if (e.expiresAt < Date.now()) { this.store.delete(idempotencyKey); return undefined; }
		return e.value;
	}
	put(idempotencyKey: string, value: T, ttlSeconds: number): void {
		this.store.set(idempotencyKey, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
	}
}

// Example adapter stubs for Redis (pseudocode)
export class RedisIdempotencyStore<T = any> implements IdempotencyStore<T> {
	constructor(private client: any, private prefix = 'idem:') {}
	get(idempotencyKey: string): T | undefined {
		// const raw = await client.get(prefix+idempotencyKey)
		// return raw ? JSON.parse(raw) : undefined
		return undefined;
	}
	put(idempotencyKey: string, value: T, ttlSeconds: number): void {
		// await client.set(prefix+idempotencyKey, JSON.stringify(value), 'EX', ttlSeconds)
	}
}


