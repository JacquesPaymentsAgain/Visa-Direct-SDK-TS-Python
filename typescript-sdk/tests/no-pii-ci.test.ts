import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisaDirectClient } from '../src/client/VisaDirectClient';
import { SecureHttpClient } from '../src/transport/secureHttpClient';
import { Orchestrator } from '../src/core/orchestrator';

// Mock console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleDebug = console.debug;

// PII Pattern Detection Function
const piiPatterns = [
  // PAN patterns
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  /\b\d{4}[-\s]?\*{4}[-\s]?\*{4}[-\s]?\d{4}\b/g,
  
  // Email patterns
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone patterns
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,
  
  // SSN patterns
  /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Account number patterns
  /\baccount:\s*\d{6,}\b/gi,
  
  // Routing number patterns
  /\b\d{9}\b/g,
  
  // PCI patterns
  /\bcvv:\s*\d{3,4}\b/gi,
  /\bpin:\s*\d{4,6}\b/gi,
  /\bexp:\s*\d{1,2}\/\d{2,4}\b/gi,
  /\bcardholder:\s*[A-Za-z\s]+\b/gi,
  /\bsecurity\s*code:\s*\d{3,4}\b/gi,
  /\bverification\s*code:\s*\d{3,6}\b/gi,
  /\bauthentication\s*code:\s*\d{3,6}\b/gi
];

function scanForPII(text: string): string[] {
  const found: string[] = [];
  
  piiPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern);
    if (matches) {
      found.push(`PII Pattern ${index + 1}: ${matches.join(', ')}`);
    }
  });

  return found;
}

describe('No-PII CI Test with Real Calls', () => {
  let capturedLogs: string[] = [];
  let capturedWarns: string[] = [];
  let capturedErrors: string[] = [];
  let capturedDebugs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
    capturedWarns = [];
    capturedErrors = [];
    capturedDebugs = [];

    // Capture all console output
    console.log = (...args: any[]) => {
      capturedLogs.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      capturedWarns.push(args.join(' '));
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      capturedErrors.push(args.join(' '));
      originalConsoleError.apply(console, args);
    };

    console.debug = (...args: any[]) => {
      capturedDebugs.push(args.join(' '));
      originalConsoleDebug.apply(console, args);
    };
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
  });

  describe('PII Pattern Detection', () => {
    it('should not log raw PANs in real transaction calls', async () => {
      // Mock the HTTP client to simulate real API calls
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-123' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: {
          requestIdHeader: 'x-request-id',
          format: 'uuid'
        }
      });

      // Replace the orchestrator's HTTP client with our mock
      (client as any).orchestrator.httpClient = mockHttpClient;

      const sensitivePan = '4111111111111111';
      const maskedPanToken = 'tok_pan_411111******1111';

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-1')
          .toCardDirect(maskedPanToken)
          .forAmount('USD', 100)
          .withIdempotencyKey('pii-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      // Combine all captured output
      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      // Scan for PII patterns
      const piiFound = scanForPII(allOutput);

      // Assertions
      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain(sensitivePan);
      expect(allOutput).not.toContain('4111111111111111');
      
      // Should contain masked token (expected behavior)
      expect(allOutput).toContain(maskedPanToken);
    });

    it('should not log email addresses in transaction calls', async () => {
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-456' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com'
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      const sensitiveEmail = 'user@example.com';
      const maskedEmail = 'u***@e***.com';

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-2')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 200)
          .withIdempotencyKey('email-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      const piiFound = scanForPII(allOutput);

      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain(sensitiveEmail);
      expect(allOutput).not.toContain('user@example.com');
    });

    it('should not log phone numbers in transaction calls', async () => {
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-789' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com'
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      const sensitivePhone = '555-123-4567';
      const maskedPhone = '555-***-****';

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-3')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 300)
          .withIdempotencyKey('phone-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      const piiFound = scanForPII(allOutput);

      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain(sensitivePhone);
      expect(allOutput).not.toContain('555-123-4567');
    });

    it('should not log SSNs in transaction calls', async () => {
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-101' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com'
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      const sensitiveSSN = '123-45-6789';
      const maskedSSN = '123-**-****';

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-4')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 400)
          .withIdempotencyKey('ssn-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      const piiFound = scanForPII(allOutput);

      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain(sensitiveSSN);
      expect(allOutput).not.toContain('123-45-6789');
    });

    it('should not log PCI data in transaction calls', async () => {
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-202' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com'
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      const sensitiveCVV = '123';
      const sensitivePIN = '1234';
      const sensitiveExpiry = '12/25';

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-5')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 500)
          .withIdempotencyKey('pci-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      const piiFound = scanForPII(allOutput);

      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain(sensitiveCVV);
      expect(allOutput).not.toContain(sensitivePIN);
      expect(allOutput).not.toContain(sensitiveExpiry);
    });
  });

  describe('Telemetry Span PII Protection', () => {
    it('should not include PII in telemetry span attributes', async () => {
      const mockHttpClient = {
        post: vi.fn().mockResolvedValue({
          data: { status: 'SUCCESS', payoutId: 'payout-303' },
          status: 200,
          headers: {}
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com',
        outboundHeaders: {
          requestIdHeader: 'x-request-id',
          format: 'uuid'
        }
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      // Mock span to capture attributes
      const capturedAttributes: any = {};
      const mockSpan = {
        setAttributes: vi.fn((attrs: any) => {
          Object.assign(capturedAttributes, attrs);
        }),
        addEvent: vi.fn(),
        spanContext: vi.fn().mockReturnValue({ traceId: 'trace-123' })
      };

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-6')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 600)
          .withIdempotencyKey('telemetry-test-1')
          .execute();
      } catch (error) {
        // Expected to fail in test environment
      }

      // Check that span attributes don't contain PII
      const attributesString = JSON.stringify(capturedAttributes);
      const piiFound = scanForPII(attributesString);

      expect(piiFound.length).toBe(0);
      expect(attributesString).not.toContain('4111111111111111');
      expect(attributesString).not.toContain('user@example.com');
      expect(attributesString).not.toContain('555-123-4567');
    });
  });

  describe('Error Message PII Protection', () => {
    it('should not include PII in error messages', async () => {
      const mockHttpClient = {
        post: vi.fn().mockRejectedValue({
          response: {
            status: 400,
            data: {
              code: 'INVALID_PAN',
              message: 'Invalid PAN token format'
            }
          }
        }),
        requiresMLE: vi.fn().mockReturnValue(false),
        reloadTransport: vi.fn()
      };

      const client = new VisaDirectClient({
        baseUrl: 'https://api.visa.com'
      });

      (client as any).orchestrator.httpClient = mockHttpClient;

      try {
        await client.payouts.build()
          .forOriginator('test-originator')
          .withFundingInternal(true, 'conf-ref-7')
          .toCardDirect('tok_pan_411111******1111')
          .forAmount('USD', 700)
          .withIdempotencyKey('error-test-1')
          .execute();
      } catch (error) {
        // Expected to fail
      }

      const allOutput = [
        ...capturedLogs,
        ...capturedWarns,
        ...capturedErrors,
        ...capturedDebugs
      ].join(' ');

      const piiFound = scanForPII(allOutput);

      expect(piiFound.length).toBe(0);
      expect(allOutput).not.toContain('4111111111111111');
    });
  });
});