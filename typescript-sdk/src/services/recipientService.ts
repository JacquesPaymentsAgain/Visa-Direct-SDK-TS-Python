import { SecureHttpClient } from '../transport/secureHttpClient';
import { InMemoryCache } from '../storage/cache';

export class RecipientService {
	constructor(private http: SecureHttpClient, private cache = new InMemoryCache()) {}

	async resolveAlias(alias: string, aliasType: string) {
		const key = `alias:${aliasType}:${alias}`;
		const { value, shouldRevalidate } = this.cache.getWithRevalidate(key);
		if (value) {
			if (shouldRevalidate) {
				void this.revalidate(key, '/visaaliasdirectory/v1/resolve', { alias, aliasType });
			}
			return value;
		}
		return this.fetchAndCache(key, '/visaaliasdirectory/v1/resolve', { alias, aliasType }, 60);
	}

	async pav(panToken: string) {
		const key = `pav:${panToken}`;
		const { value, shouldRevalidate } = this.cache.getWithRevalidate(key);
		if (value) {
			if (shouldRevalidate) {
				void this.revalidate(key, '/pav/v1/card/validation', { panToken });
			}
			return value;
		}
		return this.fetchAndCache(key, '/pav/v1/card/validation', { panToken }, 60);
	}

	async ftai(panToken: string) {
		const key = `ftai:${panToken}`;
		const { value, shouldRevalidate } = this.cache.getWithRevalidate(key);
		if (value) {
			if (shouldRevalidate) {
				void this.revalidate(key, '/paai/v1/fundstransfer/attributes/inquiry', { panToken });
			}
			return value;
		}
		return this.fetchAndCache(key, '/paai/v1/fundstransfer/attributes/inquiry', { panToken }, 60);
	}

	async validate(destinationHash: string, payload: any) {
		const key = `validate:${destinationHash}`;
		const { value, shouldRevalidate } = this.cache.getWithRevalidate(key);
		if (value) {
			if (shouldRevalidate) {
				void this.revalidate(key, '/visapayouts/v3/payouts/validate', payload);
			}
			return value;
		}
		return this.fetchAndCache(key, '/visapayouts/v3/payouts/validate', payload, 60);
	}

	private async fetchAndCache(key: string, path: string, payload: any, ttlSeconds: number) {
		const { data } = await this.http.post(path, payload);
		this.cache.set(key, data, ttlSeconds);
		return data;
	}

	private async revalidate(key: string, path: string, payload: any) {
		try {
			const { data } = await this.http.post(path, payload);
			this.cache.set(key, data, 60);
		} catch {
			// best-effort refresh
		}
	}
}
