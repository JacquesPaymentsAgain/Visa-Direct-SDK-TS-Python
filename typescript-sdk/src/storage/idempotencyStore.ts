export interface IdempotencyStore<T = any> {
	get(idempotencyKey: string): Promise<T | undefined>;
	put(idempotencyKey: string, value: T, ttlSeconds: number): Promise<void>;
}

export class InMemoryIdempotencyStore<T = any> implements IdempotencyStore<T> {
	private store = new Map<string, { value: T; expiresAt: number }>();

	async get(idempotencyKey: string): Promise<T | undefined> {
		const entry = this.store.get(idempotencyKey);
		if (!entry) return undefined;
		if (entry.expiresAt < Date.now()) {
			this.store.delete(idempotencyKey);
			return undefined;
		}
		return entry.value;
	}

	async put(idempotencyKey: string, value: T, ttlSeconds: number): Promise<void> {
		this.store.set(idempotencyKey, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
	}
}

export class RedisIdempotencyStore<T = any> implements IdempotencyStore<T> {
	constructor(
		private client: {
			get(key: string): Promise<string | null> | string | null;
			set?(key: string, value: string, ...args: any[]): Promise<any> | any;
			setEx?(key: string, ttlSeconds: number, value: string): Promise<any> | any;
		},
		private prefix = 'idem:',
		private serializer: (value: T) => string = JSON.stringify,
		private deserializer: (value: string) => T = JSON.parse
	) {}

	private toKey(idempotencyKey: string): string {
		return `${this.prefix}${idempotencyKey}`;
	}

	async get(idempotencyKey: string): Promise<T | undefined> {
		const key = this.toKey(idempotencyKey);
		const raw = await Promise.resolve(this.client.get(key));
		if (raw === null || raw === undefined) return undefined;
		const payload = typeof raw === 'string' ? raw : String(raw);
		return this.deserializer(payload);
	}

	async put(idempotencyKey: string, value: T, ttlSeconds: number): Promise<void> {
		const key = this.toKey(idempotencyKey);
		const payload = this.serializer(value);

		if (typeof this.client.setEx === 'function') {
			await Promise.resolve(this.client.setEx(key, ttlSeconds, payload));
			return;
		}

		if (typeof this.client.set === 'function') {
			await Promise.resolve(this.client.set(key, payload, 'EX', ttlSeconds));
			return;
		}

		throw new Error('Redis client must support setEx or set with EX option');
	}
}

