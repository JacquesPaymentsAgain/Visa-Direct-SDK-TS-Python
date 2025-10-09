import { SecureHttpClient } from '../transport/secureHttpClient';
import { Orchestrator } from '../core/orchestrator';
import { PayoutBuilder } from '../dx/builder';
import { RedisIdempotencyStore, RedisReceiptStore } from '../storage';
import Redis from 'ioredis';

export interface OutboundHeadersConfig {
  requestIdHeader: string;
  format: 'uuid' | 'ulid' | 'prefix+ts';
  prefix?: string;
}

export interface VisaDirectClientConfig {
  baseUrl?: string;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  envMode?: 'production' | 'dev';
  redisUrl?: string;
  userId?: string;
  password?: string;
  apiKey?: string;
  sharedSecret?: string;
  outboundHeaders?: OutboundHeadersConfig;
}

export class VisaDirectClient {
  private orchestrator: Orchestrator;
  private redis?: Redis;
  private config: VisaDirectClientConfig;

  constructor(config: VisaDirectClientConfig = {}) {
    this.config = {
      outboundHeaders: {
        requestIdHeader: 'x-request-id',
        format: 'uuid',
        prefix: 'visa-sdk'
      },
      ...config
    };

    // Create HTTP client with mTLS and correlation headers
    const httpClient = new SecureHttpClient({
      baseUrl: this.config.baseUrl || process.env.VISA_BASE_URL,
      certPath: this.config.certPath || process.env.VISA_CERT_PATH,
      keyPath: this.config.keyPath || process.env.VISA_KEY_PATH,
      caPath: this.config.caPath || process.env.VISA_CA_PATH,
      outboundHeaders: this.config.outboundHeaders,
    });

    // Initialize Redis if URL provided
    const redisUrl = this.config.redisUrl || process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    }

    // Create orchestrator with Redis stores
    this.orchestrator = new Orchestrator(httpClient, {
      idempotencyStore: this.redis ? new RedisIdempotencyStore(this.redis) : undefined,
      receiptStore: this.redis ? new RedisReceiptStore(this.redis) : undefined,
    });
  }

  get payouts() {
    return {
      build: () => new PayoutBuilder(this.orchestrator)
    };
  }

  async reloadTransport(newOpts?: {
    certPath?: string;
    keyPath?: string;
    caPath?: string;
    baseUrl?: string;
  }): Promise<void> {
    return this.orchestrator.httpClient.reloadTransport(newOpts);
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}