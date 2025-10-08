import { SecureHttpClient } from '../transport/secureHttpClient';
import { InMemoryCache } from '../storage/cache';

export class QuotingService {
	constructor(private http: SecureHttpClient, private cache = new InMemoryCache()) {}

	async lock(srcCurrency: string, dstCurrency: string, amountMinor: number) {
		const key = `quote:${srcCurrency}:${dstCurrency}:${amountMinor}`;
		const { value, shouldRevalidate } = this.cache.getWithRevalidate(key);
		if (value) {
			if (shouldRevalidate) {
				void this.revalidate(key, srcCurrency, dstCurrency, amountMinor);
			}
			return value;
		}
		return this.fetchAndCache(key, srcCurrency, dstCurrency, amountMinor);
	}

	private async fetchAndCache(key: string, srcCurrency: string, dstCurrency: string, amountMinor: number) {
		const { data } = await this.http.post('/forexrates/v1/lock', { src: srcCurrency, dst: dstCurrency, amount: { minor: amountMinor } });
		this.cache.set(key, data, 300);
		return data;
	}

	private async revalidate(key: string, srcCurrency: string, dstCurrency: string, amountMinor: number) {
		try {
			const { data } = await this.http.post('/forexrates/v1/lock', { src: srcCurrency, dst: dstCurrency, amount: { minor: amountMinor } });
			this.cache.set(key, data, 300);
		} catch {
			// best-effort refresh
		}
	}
}
