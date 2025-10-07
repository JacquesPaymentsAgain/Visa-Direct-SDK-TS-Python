import { SecureHttpClient } from '../transport/secureHttpClient';
import { InMemoryCache } from '../storage/cache';

export class QuotingService {
	constructor(private http: SecureHttpClient, private cache = new InMemoryCache()) {}

	async lock(srcCurrency: string, dstCurrency: string, amountMinor: number) {
		const key = `quote:${srcCurrency}:${dstCurrency}:${amountMinor}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const { data } = await this.http.post('/forexrates/v1/lock', { src: srcCurrency, dst: dstCurrency, amount: { minor: amountMinor } });
		this.cache.set(key, data, 300);
		return data;
	}
}

