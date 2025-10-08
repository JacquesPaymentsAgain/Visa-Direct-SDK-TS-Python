export interface ReceiptStore {
	consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): Promise<boolean>;
}

export class InMemoryReceiptStore implements ReceiptStore {
	private used = new Set<string>();

	async consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): Promise<boolean> {
		const key = `${namespace}:${receiptId}`;
		if (this.used.has(key)) return false;
		this.used.add(key);
		return true;
	}
}

export class RedisReceiptStore implements ReceiptStore {
	constructor(
		private client: {
			set?(key: string, value: string, ...args: any[]): Promise<any> | any;
			setNX?(key: string, value: string): Promise<number | boolean> | number | boolean;
			expire?(key: string, ttlSeconds: number): Promise<any> | any;
		},
		private prefix = 'receipt:',
		private ttlSeconds = 86400
	) {}

	private toKey(namespace: string, receiptId: string): string {
		return `${this.prefix}${namespace}:${receiptId}`;
	}

	async consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): Promise<boolean> {
		const key = this.toKey(namespace, receiptId);

		if (typeof this.client.set === 'function') {
			const result = await Promise.resolve(this.client.set(key, '1', 'NX', 'EX', this.ttlSeconds));
			// ioredis returns 'OK' for success and null when NX fails
			if (result === null || result === false) return false;
			return true;
		}

		if (typeof this.client.setNX === 'function') {
			const set = await Promise.resolve(this.client.setNX(key, '1'));
			const wasSet = typeof set === 'boolean' ? set : set === 1;
			if (!wasSet) return false;
			if (typeof this.client.expire === 'function') {
				await Promise.resolve(this.client.expire(key, this.ttlSeconds));
			}
			return true;
		}

		throw new Error('Redis client must support set (NX, EX) or setNX + expire');
	}
}
