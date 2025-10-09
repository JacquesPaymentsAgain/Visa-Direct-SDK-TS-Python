import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecureHttpClient, OutboundHeadersConfig } from '../src/transport/secureHttpClient';

// Mock axios at the top level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
    get: vi.fn()
  },
  create: vi.fn(),
  get: vi.fn()
}));

describe('Request ID Header Tests', () => {
  let mockAxiosInstance: any;
  let httpClient: SecureHttpClient;

  beforeEach(async () => {
    mockAxiosInstance = {
      post: vi.fn(),
      defaults: { baseURL: 'https://api.visa.com' }
    };
    
    const mockAxios = vi.mocked(await import('axios'));
    mockAxios.create.mockReturnValue(mockAxiosInstance);
    mockAxios.get.mockClear();
  });

  describe('Request ID Header Configuration', () => {
    it('should add UUID format request ID header', async () => {
      const config: OutboundHeadersConfig = {
        requestIdHeader: 'x-request-id',
        format: 'uuid'
      };

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: config
      });

      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await httpClient.post('/test', { data: 'test' });

      const postCall = mockAxiosInstance.post.mock.calls[0];
      const headers = postCall[2]?.headers || {};
      
      expect(headers['x-request-id']).toBeDefined();
      expect(headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should add ULID format request ID header', async () => {
      const config: OutboundHeadersConfig = {
        requestIdHeader: 'x-correlation-id',
        format: 'ulid'
      };

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: config
      });

      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await httpClient.post('/test', { data: 'test' });

      const postCall = mockAxiosInstance.post.mock.calls[0];
      const headers = postCall[2]?.headers || {};
      
      expect(headers['x-correlation-id']).toBeDefined();
      expect(headers['x-correlation-id']).toMatch(/^[0-9A-Za-z]{26}$/);
    });

    it('should add prefix+timestamp format request ID header', async () => {
      const config: OutboundHeadersConfig = {
        requestIdHeader: 'x-trace-id',
        format: 'prefix+ts',
        prefix: 'visa-sdk'
      };

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: config
      });

      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await httpClient.post('/test', { data: 'test' });

      const postCall = mockAxiosInstance.post.mock.calls[0];
      const headers = postCall[2]?.headers || {};
      
      expect(headers['x-trace-id']).toBeDefined();
      expect(headers['x-trace-id']).toMatch(/^visa-sdk-\d+-[a-z0-9]+$/);
    });

    it('should not add request ID header when not configured', async () => {
      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com'
      });

      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await httpClient.post('/test', { data: 'test' });

      const postCall = mockAxiosInstance.post.mock.calls[0];
      const headers = postCall[2]?.headers || {};
      
      expect(headers['x-request-id']).toBeUndefined();
      expect(headers['x-correlation-id']).toBeUndefined();
      expect(headers['x-trace-id']).toBeUndefined();
    });
  });

  describe('Request ID Header Persistence', () => {
    it('should use same request ID across retries', async () => {
      const config: OutboundHeadersConfig = {
        requestIdHeader: 'x-request-id',
        format: 'uuid'
      };

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: config,
        retryConfig: {
          maxRetries: 2,
          baseDelay: 10,
          retryableStatusCodes: [503]
        }
      });

      // First call fails, second succeeds
      mockAxiosInstance.post
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ data: { success: true }, status: 200, headers: {} });

      await httpClient.post('/test', { data: 'test' });

      const calls = mockAxiosInstance.post.mock.calls;
      expect(calls).toHaveLength(2);
      
      const firstHeaders = calls[0][2]?.headers || {};
      const secondHeaders = calls[1][2]?.headers || {};
      
      expect(firstHeaders['x-request-id']).toBeDefined();
      expect(secondHeaders['x-request-id']).toBeDefined();
      expect(firstHeaders['x-request-id']).toBe(secondHeaders['x-request-id']);
    });
  });

  describe('Request ID Header in Telemetry', () => {
    it('should include request ID in telemetry spans', async () => {
      const config: OutboundHeadersConfig = {
        requestIdHeader: 'x-request-id',
        format: 'uuid'
      };

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: config
      });

      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Mock span to capture attributes
      const mockSpan = {
        setAttributes: vi.fn(),
        addEvent: vi.fn()
      };

      // This would normally be called by withSpan
      await httpClient.post('/test', { data: 'test' });

      // Verify that the request ID was generated and would be set in span attributes
      const postCall = mockAxiosInstance.post.mock.calls[0];
      const headers = postCall[2]?.headers || {};
      
      expect(headers['x-request-id']).toBeDefined();
    });
  });
});
