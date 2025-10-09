import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecureHttpClient } from '../src/transport/secureHttpClient';
import { JwksCircuitBreaker } from '../src/utils/jwksCircuitBreaker';
import { JWEDecryptError, JWEKidUnknownError } from '../src/types/errors';

// Mock axios at the top level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
    get: vi.fn()
  },
  create: vi.fn(),
  get: vi.fn()
}));

describe('MLE/JWKS Production Fail-Closed Tests', () => {
  let httpClient: SecureHttpClient;
  let mockAxiosInstance: any;

  beforeEach(async () => {
    mockAxiosInstance = {
      post: vi.fn(),
      defaults: { baseURL: 'https://api.visa.com' }
    };
    
    const mockAxios = vi.mocked(await import('axios'));
    mockAxios.create.mockReturnValue(mockAxiosInstance);
    mockAxios.get.mockClear();
    
    // Reset environment
    process.env.SDK_ENV = 'production';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.SDK_ENV;
  });

  describe('JWKS Circuit Breaker Fail-Closed Behavior', () => {
    it('should fail closed when JWKS service is unavailable in production', async () => {
      // Mock JWKS endpoint to fail
      mockAxios.get.mockRejectedValue(new Error('JWKS service unavailable'));

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      // Mock successful API response that requires MLE decryption
      mockAxiosInstance.post.mockResolvedValue({
        data: 'encrypted-response-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      // Attempt to make a request that requires MLE decryption
      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow('Unable to fetch JWKS');

      // Verify JWKS was attempted
      expect(mockAxios.get).toHaveBeenCalled();
    });

    it('should fail closed when JWKS circuit breaker is open', async () => {
      // Create circuit breaker that's already open
      const circuitBreaker = new JwksCircuitBreaker({
        maxFailures: 1,
        timeoutMs: 1000,
        resetTimeoutMs: 10000
      });

      // Force circuit breaker to open state
      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('JWKS fetch failed');
        })
      ).rejects.toThrow('JWKS fetch failed');

      // Now circuit breaker should be open
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Attempt another operation should fail immediately
      await expect(
        circuitBreaker.execute(async () => {
          return { keys: [] };
        })
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should fail closed when JWKS response is invalid', async () => {
      // Mock JWKS endpoint to return invalid response
      mockAxios.get.mockResolvedValue({
        data: { invalid: 'response' } // Missing 'keys' field
      });

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: 'encrypted-response-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow();
    });

    it('should fail closed when JWKS keys are empty', async () => {
      // Mock JWKS endpoint to return empty keys
      mockAxios.get.mockResolvedValue({
        data: { keys: [] }
      });

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: 'encrypted-response-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow();
    });
  });

  describe('JWE Decryption Fail-Closed Behavior', () => {
    beforeEach(() => {
      // Mock successful JWKS response
      mockAxios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              use: 'enc',
              alg: 'RSA-OAEP-256',
              n: 'test-modulus',
              e: 'AQAB'
            }
          ]
        }
      });
    });

    it('should fail closed when JWE decryption fails with unknown key ID', async () => {
      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      // Mock encrypted response with unknown key ID
      mockAxiosInstance.post.mockResolvedValue({
        data: 'eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoiaW52YWxpZC1rZXktaWQifQ.test.encrypted',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow(JWEKidUnknownError);
    });

    it('should fail closed when JWE decryption fails with malformed JWE', async () => {
      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      // Mock malformed JWE response
      mockAxiosInstance.post.mockResolvedValue({
        data: 'malformed-jwe-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow(JWEDecryptError);
    });

    it('should fail closed when JWE decryption fails after JWKS refresh', async () => {
      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      // Mock encrypted response that fails even after JWKS refresh
      mockAxiosInstance.post.mockResolvedValue({
        data: 'eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoiaW52YWxpZC1rZXktaWQifQ.test.encrypted',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow(JWEKidUnknownError);
    });
  });

  describe('JWE Encryption Fail-Closed Behavior', () => {
    beforeEach(() => {
      // Mock successful JWKS response
      mockAxios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              use: 'enc',
              alg: 'RSA-OAEP-256',
              n: 'test-modulus',
              e: 'AQAB'
            }
          ]
        }
      });
    });

    it('should fail closed when JWE encryption fails', async () => {
      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      // Mock JWKS to fail during encryption
      mockAxios.get.mockRejectedValue(new Error('JWKS unavailable during encryption'));

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow('Unable to fetch JWKS');
    });

    it('should fail closed when encryption key is invalid', async () => {
      // Mock JWKS with invalid encryption key
      mockAxios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'invalid-key-id',
              kty: 'INVALID',
              use: 'enc',
              alg: 'RSA-OAEP-256',
              n: 'invalid-modulus',
              e: 'invalid-exponent'
            }
          ]
        }
      });

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow();
    });
  });

  describe('Production vs Development Behavior', () => {
    it('should fail closed in production when JWKS is unavailable', async () => {
      process.env.SDK_ENV = 'production';
      
      mockAxios.get.mockRejectedValue(new Error('JWKS service unavailable'));

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: 'encrypted-response-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      await expect(
        httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
          test: 'data'
        })
      ).rejects.toThrow('Unable to fetch JWKS');
    });

    it('should fail open in development when JWKS is unavailable', async () => {
      process.env.SDK_ENV = 'development';
      
      mockAxios.get.mockRejectedValue(new Error('JWKS service unavailable'));

      httpClient = new SecureHttpClient({
        baseUrl: 'https://api.visa.com',
        endpointsFile: './endpoints/endpoints.json'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: 'encrypted-response-data',
        status: 200,
        headers: { 'content-type': 'application/jwe' }
      });

      // Should not throw in development mode
      const result = await httpClient.post('/visadirect/fundstransfer/v1/pushfunds', {
        test: 'data'
      });

      expect(result.data).toBe('encrypted-response-data');
    });
  });

  describe('Circuit Breaker State Management', () => {
    it('should track circuit breaker state correctly', () => {
      const circuitBreaker = new JwksCircuitBreaker({
        maxFailures: 2,
        timeoutMs: 1000,
        resetTimeoutMs: 5000
      });

      // Initially closed
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // After one failure, still closed
      circuitBreaker.execute(async () => {
        throw new Error('First failure');
      }).catch(() => {});
      
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // After second failure, should be open
      circuitBreaker.execute(async () => {
        throw new Error('Second failure');
      }).catch(() => {});
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should transition to half-open after timeout', async () => {
      const circuitBreaker = new JwksCircuitBreaker({
        maxFailures: 1,
        timeoutMs: 1000,
        resetTimeoutMs: 100 // Short reset timeout for testing
      });

      // Force open state
      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('Failure');
        })
      ).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be half-open
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should reset to closed after successful operation', async () => {
      const circuitBreaker = new JwksCircuitBreaker({
        maxFailures: 1,
        timeoutMs: 1000,
        resetTimeoutMs: 100
      });

      // Force open state
      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('Failure');
        })
      ).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Successful operation should reset to closed
      await circuitBreaker.execute(async () => {
        return { success: true };
      });

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Timeout Protection', () => {
    it('should timeout JWKS operations', async () => {
      const circuitBreaker = new JwksCircuitBreaker({
        maxFailures: 1,
        timeoutMs: 100, // Very short timeout
        resetTimeoutMs: 1000
      });

      // Mock a slow JWKS operation
      const slowOperation = () => new Promise((resolve) => {
        setTimeout(() => resolve({ keys: [] }), 200);
      });

      await expect(
        circuitBreaker.execute(slowOperation)
      ).rejects.toThrow('JWKS operation timeout');
    });
  });
});
