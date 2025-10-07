export interface ReceiptStore {
	consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): boolean;
}

export class InMemoryReceiptStore implements ReceiptStore {
	private used = new Set<string>();
	consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): boolean {
		const key = `${namespace}:${receiptId}`;
		if (this.used.has(key)) return false;
		this.used.add(key);
		return true;
	}
}

export class RedisReceiptStore implements ReceiptStore {
	constructor(private client: any, private prefix = 'receipt:') {}
	consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): boolean {
		// const key = `${this.prefix}${namespace}:${receiptId}`
		// const set = await client.setnx(key, '1')
		// if (set === 0) return false
		// await client.expire(key, 86400)
		return true;
	}
}


