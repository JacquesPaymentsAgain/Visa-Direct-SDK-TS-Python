export interface Cache<K = string, V = any> {
	get(key: K): V | undefined;
	set(key: K, value: V, ttlSeconds: number): void;
	getWithRevalidate(key: K): { value: V | undefined; shouldRevalidate: boolean };
}

export class InMemoryCache implements Cache<string, any> {
	private store = new Map<string, { value: any; expiresAt: number; createdAt: number }>();
	get(key: string) {
		const e = this.store.get(key);
		if (!e) return undefined;
		if (e.expiresAt < Date.now()) { this.store.delete(key); return undefined; }
		return e.value;
	}
	set(key: string, value: any, ttlSeconds: number) {
		const now = Date.now();
		this.store.set(key, { value, expiresAt: now + ttlSeconds * 1000, createdAt: now });
	}
	getWithRevalidate(key: string) {
		const e = this.store.get(key);
		if (!e) return { value: undefined, shouldRevalidate: false };
		if (e.expiresAt < Date.now()) { this.store.delete(key); return { value: undefined, shouldRevalidate: false }; }
		// Background revalidate if entry is older than half TTL
		const age = Date.now() - e.createdAt;
		const ttl = e.expiresAt - e.createdAt;
		const shouldRevalidate = age > ttl / 2;
		return { value: e.value, shouldRevalidate };
	}
}
