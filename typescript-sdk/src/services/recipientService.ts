import { SecureHttpClient } from '../transport/secureHttpClient';
import { InMemoryCache } from '../storage/cache';

export class RecipientService {
	constructor(private http: SecureHttpClient, private cache = new InMemoryCache()) {}

	async resolveAlias(alias: string, aliasType: string) {
		const key = `alias:${aliasType}:${alias}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const { data } = await this.http.post('/visaaliasdirectory/v1/resolve', { alias, aliasType });
		this.cache.set(key, data, 60);
		return data;
	}

	async pav(panToken: string) {
		const key = `pav:${panToken}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const { data } = await this.http.post('/pav/v1/card/validation', { panToken });
		this.cache.set(key, data, 60);
		return data;
	}

	async ftai(panToken: string) {
		const key = `ftai:${panToken}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const { data } = await this.http.post('/paai/v1/fundstransfer/attributes/inquiry', { panToken });
		this.cache.set(key, data, 60);
		return data;
	}

	async validate(destinationHash: string, payload: any) {
		const key = `validate:${destinationHash}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const { data } = await this.http.post('/visapayouts/v3/payouts/validate', payload);
		this.cache.set(key, data, 60);
		return data;
	}
}
