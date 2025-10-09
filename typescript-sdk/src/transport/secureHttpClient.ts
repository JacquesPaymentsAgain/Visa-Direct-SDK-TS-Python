import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Span } from '@opentelemetry/api';
import { JWEHeaderParameters, importJWK, CompactEncrypt, compactDecrypt, decodeProtectedHeader } from 'jose';
import { JWEDecryptError, JWEKidUnknownError } from '../types/errors';
import { initOtel, withSpan } from '../utils/otel';
import { randomUUID } from 'crypto';
import { mapVisaError, VisaDirectError } from '../types/visaErrors';
import { JwksCircuitBreaker } from '../utils/jwksCircuitBreaker';
import { RetryStrategy, RetryConfig } from '../utils/retryStrategy';

type EndpointRoute = { path: string; requiresMLE: boolean };
type EndpointsConfig = {
	baseUrls: { [k: string]: string };
	routes: EndpointRoute[];
	jwks?: { url: string; cacheTtlSeconds?: number };
};

export interface OutboundHeadersConfig {
	requestIdHeader: string;
	format: 'uuid' | 'ulid' | 'prefix+ts';
	prefix?: string;
}

export class SecureHttpClient {
	private client: AxiosInstance;
	private endpoints: EndpointsConfig;
	private jwksCache?: { expiresAt: number; jwks: any };
	private publicEncryptionJwk?: any; // placeholder; in real use, fetch from config
	private envMode: 'production' | 'dev' = (process.env.SDK_ENV === 'production' ? 'production' : 'dev');
	private outboundHeaders?: OutboundHeadersConfig;
	private jwksCircuitBreaker: JwksCircuitBreaker;
	private retryStrategy: RetryStrategy;
	private certPath?: string;
	private keyPath?: string;
	private caPath?: string;
	private baseURL?: string;

	constructor(opts: {
		baseUrl?: string;
		certPath?: string;
		keyPath?: string;
		caPath?: string;
		endpointsFile?: string;
		outboundHeaders?: OutboundHeadersConfig;
		retryConfig?: Partial<RetryConfig>;
	}) {
		initOtel();
		this.outboundHeaders = opts.outboundHeaders;
		this.certPath = opts.certPath;
		this.keyPath = opts.keyPath;
		this.caPath = opts.caPath;
		this.baseURL = opts.baseUrl;
		
		this.jwksCircuitBreaker = new JwksCircuitBreaker({
			maxFailures: 3,
			timeoutMs: 10000,
			resetTimeoutMs: 60000
		});

		this.retryStrategy = new RetryStrategy(opts.retryConfig);
		const endpointsFile = opts.endpointsFile ?? path.resolve(process.cwd(), '../endpoints/endpoints.json');
		const raw = fs.readFileSync(endpointsFile, 'utf8');
		// simple env var substitution for ${VAR:-default}
		const withEnv = raw.replace(/\$\{([^:}]+)(?::-(.*?))?}/g, (_, varName, def) => process.env[varName] ?? (def ?? ''));
		this.endpoints = JSON.parse(withEnv);

		const baseURL = this.baseURL ?? process.env.VISA_BASE_URL ?? this.endpoints.baseUrls['visa'];

		const httpsAgentOptions: any = {};
		if (opts.certPath) httpsAgentOptions.cert = fs.readFileSync(opts.certPath);
		if (opts.keyPath) httpsAgentOptions.key = fs.readFileSync(opts.keyPath);
		if (opts.caPath) httpsAgentOptions.ca = fs.readFileSync(opts.caPath);

		this.client = axios.create({ baseURL, httpsAgent: Object.keys(httpsAgentOptions).length ? new (require('https').Agent)(httpsAgentOptions) : undefined });
	}

	public async reloadTransport(newOpts?: {
		certPath?: string;
		keyPath?: string;
		caPath?: string;
		baseUrl?: string;
	}): Promise<void> {
		this._log('transport.reload.started', { 
			hasNewCert: !!newOpts?.certPath,
			hasNewKey: !!newOpts?.keyPath,
			hasNewCA: !!newOpts?.caPath,
			hasNewBaseUrl: !!newOpts?.baseUrl
		});

		try {
			// Update stored paths
			if (newOpts?.certPath) this.certPath = newOpts.certPath;
			if (newOpts?.keyPath) this.keyPath = newOpts.keyPath;
			if (newOpts?.caPath) this.caPath = newOpts.caPath;
			if (newOpts?.baseUrl) this.baseURL = newOpts.baseUrl;

			// Create new HTTPS agent with updated certificates
			const httpsAgentOptions: any = {};
			if (this.certPath) httpsAgentOptions.cert = fs.readFileSync(this.certPath);
			if (this.keyPath) httpsAgentOptions.key = fs.readFileSync(this.keyPath);
			if (this.caPath) httpsAgentOptions.ca = fs.readFileSync(this.caPath);

			const baseURL = this.baseURL ?? process.env.VISA_BASE_URL ?? this.endpoints.baseUrls['visa'];

			// Create new axios instance
			this.client = axios.create({ 
				baseURL, 
				httpsAgent: Object.keys(httpsAgentOptions).length ? new (require('https').Agent)(httpsAgentOptions) : undefined 
			});

			// Clear JWKS cache to force refresh with new certificates
			this.jwksCache = undefined;

			this._log('transport.reload.success', { 
				certPath: this.certPath,
				keyPath: this.keyPath,
				caPath: this.caPath,
				baseURL: baseURL
			});
		} catch (error: any) {
			this._log('transport.reload.failure', { 
				error: error.message,
				certPath: this.certPath,
				keyPath: this.keyPath,
				caPath: this.caPath
			});
			throw new Error(`Failed to reload transport: ${error.message}`);
		}
	}

	private generateCorrelationId(): string {
		if (!this.outboundHeaders) return randomUUID();
		
		const { format, prefix } = this.outboundHeaders;
		switch (format) {
			case 'uuid':
				return randomUUID();
			case 'ulid':
				// Simple ULID implementation (timestamp + random)
				const timestamp = Date.now().toString(36);
				const random = Math.random().toString(36).substring(2, 12);
				return `${timestamp}${random}`.padEnd(26, '0');
			case 'prefix+ts':
				const ts = Date.now();
				const randomSuffix = Math.random().toString(36).substring(2, 8);
				return `${prefix || 'visa-sdk'}-${ts}-${randomSuffix}`;
			default:
				return randomUUID();
		}
	}

	private _log(event: string, data: Record<string, any>) {
		try {
			// Minimal structured log; avoid sensitive payloads
			console.debug('[telemetry]', { event, ...data });
		} catch {}
	}

	requiresMLE(routePath: string): boolean {
		const found = this.endpoints.routes.find(r => r.path === routePath || (r.path.includes(':') && this._matchParamRoute(r.path, routePath)));
		return !!found?.requiresMLE;
	}

	private _matchParamRoute(template: string, actual: string): boolean {
		const t = template.split('/');
		const a = actual.split('/');
		if (t.length !== a.length) return false;
		for (let i = 0; i < t.length; i++) {
			if (t[i].startsWith(':')) continue;
			if (t[i] !== a[i]) return false;
		}
		return true;
	}

	async post<T = any>(pathUrl: string, data: any, config?: AxiosRequestConfig): Promise<{ data: T; status: number; headers: any }> {
		return withSpan('secureHttpClient.post', async (span) => {
			// Generate correlation ID for retry context
			const correlationId = this.outboundHeaders ? this.generateCorrelationId() : undefined;
			
			return this.retryStrategy.execute(async () => {
				try {
					let payload = data;
					let headers: any = { ...(config?.headers || {}) };
					const requiresMLE = this.requiresMLE(pathUrl);
					let usedEncryption = false;

					// Add correlation headers
					if (this.outboundHeaders && correlationId) {
						headers[this.outboundHeaders.requestIdHeader] = correlationId;
						span?.setAttributes({
							'visa.correlation_id': correlationId,
							'visa.request_id_header': this.outboundHeaders.requestIdHeader
						});
					}

					span?.setAttributes({
						'http.method': 'POST',
						'http.url': `${this.client.defaults.baseURL ?? ''}${pathUrl}`,
						'visa.requires_mle': requiresMLE,
						'visa.sdk.env': this.envMode
					});

					if (requiresMLE) {
						this._log('jwe.encrypt.started', { path: pathUrl });
						span?.addEvent('jwe.encrypt.started');
						const encrypted = await this.encryptJwe(data, span);
						payload = encrypted.body;
						headers = { ...headers, ...encrypted.headers };
						usedEncryption = encrypted.usedMle;
					}
					const res = await this.client.post(pathUrl, payload, { ...(config || {}), headers });
					let resData = res.data;
					if (requiresMLE && usedEncryption) {
						try {
							resData = await this.decryptJwe(res.data, span);
							this._log('jwe.decrypt.success', { path: pathUrl });
							span?.addEvent('jwe.decrypt.success');
						} catch (e: any) {
							this._log('jwe.decrypt.retry_on_kid_miss', { path: pathUrl });
							span?.addEvent('jwe.decrypt.retry_on_kid_miss');
							// retry once by refreshing JWKS
							await this.refreshJwks();
							try {
								resData = await this.decryptJwe(res.data, span);
								this._log('jwe.decrypt.success_after_refresh', { path: pathUrl });
								span?.addEvent('jwe.decrypt.success_after_refresh');
							} catch (e2: any) {
								if (e2 instanceof JWEKidUnknownError) throw e2;
								throw new JWEDecryptError(String(e2?.message || e2));
							}
						}
					} else if (requiresMLE) {
						resData = this.parseMaybeJson(res.data);
					}
					span?.setAttribute('http.status_code', res.status);
					return { data: resData, status: res.status, headers: res.headers };
				} catch (error: any) {
					// Map HTTP errors to Visa-specific errors
					const httpStatus = error.response?.status || 500;
					const visaCode = error.response?.data?.code || error.response?.data?.errorCode;
					const errorMessage = error.response?.data?.message || error.message;
					
					const visaError = mapVisaError(httpStatus, visaCode, errorMessage, {
						rail: this.extractRailFromPath(pathUrl),
						corridor: this.extractCorridorFromPath(pathUrl)
					});
					
					span?.setAttributes({
						'http.status_code': httpStatus,
						'visa.error_code': visaCode || 'UNKNOWN',
						'visa.error_name': visaError.name,
						'visa.retryable': visaError.retryable
					});
					
					throw new VisaDirectError(visaError, httpStatus, visaCode || 'UNKNOWN');
				}
			}, {
				operation: `POST ${pathUrl}`,
				correlationId: correlationId
			});
		}, { attributes: { 'http.route': pathUrl } });
	}

	private parseMaybeJson(value: any): any {
		if (typeof value === 'string') {
			try {
				return JSON.parse(value);
			} catch {
				return value;
			}
		}
		return value;
	}

	private extractRailFromPath(path: string): string | undefined {
		if (path.includes('/fundstransfer/')) return 'AFT';
		if (path.includes('/payouts')) return 'OCT';
		if (path.includes('/accountpayouts')) return 'ACCOUNT';
		if (path.includes('/walletpayouts')) return 'WALLET';
		return undefined;
	}

	private extractCorridorFromPath(path: string): string | undefined {
		// This would typically be extracted from request data, not path
		// For now, return undefined - will be populated by orchestrator
		return undefined;
	}

	private async getJwks(): Promise<any> {
		const ttl = this.endpoints?.jwks?.cacheTtlSeconds ?? 300;
		const now = Math.floor(Date.now() / 1000);
		if (this.jwksCache && this.jwksCache.expiresAt > now) return this.jwksCache.jwks;
		
		const url = this.endpoints?.jwks?.url;
		if (!url) return { keys: [] };
		
		this._log('jwks.fetch.started', { url });
		
		try {
			const data = await this.jwksCircuitBreaker.execute(async () => {
				const { data } = await axios.get(url);
				return data;
			});
			
			this._log('jwks.fetch.success', { url });
			this.jwksCache = { jwks: data, expiresAt: now + ttl };
			return data;
		} catch (error: any) {
			this._log('jwks.fetch.failure', { 
				url, 
				message: error?.message,
				circuitBreakerState: this.jwksCircuitBreaker.getState()
			});
			
			if (this.envMode === 'production') {
				throw new JWEDecryptError('Unable to fetch JWKS');
			}
			this.jwksCache = { jwks: { keys: [] }, expiresAt: now + ttl };
			return { keys: [] };
		}
	}

	private async refreshJwks(): Promise<void> {
		this.jwksCache = undefined;
		await this.getJwks();
	}

	private async encryptJwe(payload: any, span?: Span): Promise<{ body: any; headers: Record<string, string>; usedMle: boolean }> {
		// In real systems, choose recipient key from JWKS or config; here pick first available
		const jwks = await this.getJwks();
		const key = jwks.keys?.[0];
		if (!key) {
			if (this.envMode === 'production') {
				span?.addEvent('jwe.encrypt.failure');
				throw new JWEDecryptError('JWKS unavailable for MLE encryption');
			}
			// dev: fallback to no-op for simulator
			span?.addEvent('jwe.encrypt.dev_passthrough');
			return {
				body: payload,
				headers: { 'content-type': 'application/json' },
				usedMle: false
			};
		}
		const pubKey = await importJWK(key, 'RSA-OAEP-256').catch(() => importJWK(key));
		const kid = key.kid || 'unknown';
		const plaintext = Buffer.from(JSON.stringify(payload));
		const jwe = await new CompactEncrypt(plaintext)
			.setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM', kid } as any)
			.encrypt(pubKey as any);
		const result = {
			body: jwe,
			headers: { 'content-type': 'application/jose', 'x-jwe-kid': kid },
			usedMle: true
		};
		span?.addEvent('jwe.encrypt.success', { kid });
		return result;
	}

	private async decryptJwe(jwe: any, span?: Span): Promise<any> {
		// Accept either compact JWE or plaintext fallback
		if (typeof jwe !== 'string') {
			return jwe;
		}
		if (!jwe.includes('.')) {
			return JSON.parse(jwe);
		}
		const jwks = await this.getJwks();
		const header = decodeProtectedHeader(jwe);
		const kid = header.kid;
		const match = jwks.keys?.find((k: any) => k.kid === kid);
		if (!match) {
			span?.addEvent('jwe.decrypt.unknown_kid', { kid });
			throw new JWEKidUnknownError('Unknown kid');
		}
		const priv = await importJWK(match, header.alg as any).catch(() => importJWK(match));
		try {
			const { plaintext } = await compactDecrypt(jwe, priv as any);
			return JSON.parse(Buffer.from(plaintext).toString('utf8'));
		} catch (e) {
			span?.addEvent('jwe.decrypt.error');
			throw new JWEDecryptError(String((e as any)?.message || e));
		}
	}
}
