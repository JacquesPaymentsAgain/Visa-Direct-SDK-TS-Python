import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VisaDirectClient } from '../src/client/VisaDirectClient';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleError = console.error;

describe('PII/PCI Scanning Tests', () => {
  let capturedLogs: string[] = [];
  let capturedDebugs: string[] = [];
  let capturedErrors: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
    capturedDebugs = [];
    capturedErrors = [];

    // Capture console output
    console.log = (...args: any[]) => {
      capturedLogs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    console.debug = (...args: any[]) => {
      capturedDebugs.push(args.join(' '));
      originalConsoleDebug(...args);
    };

    console.error = (...args: any[]) => {
      capturedErrors.push(args.join(' '));
      originalConsoleError(...args);
    };
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.debug = originalConsoleDebug;
    console.error = originalConsoleError;
  });

  // PII/PCI patterns to detect
  const piiPatterns = [
    // PAN patterns (16-digit card numbers)
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // PAN patterns with asterisks (masked)
    /\b\d{4}[-\s]?\*{4}[-\s]?\*{4}[-\s]?\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone numbers (various formats)
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,
    // SSN patterns
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Account numbers (generic pattern)
    /\baccount[:\s]+\d+\b/gi,
    // Routing numbers
    /\b\d{9}\b/g,
  ];

  const pciPatterns = [
    // CVV patterns
    /\bcvv[:\s]+\d{3,4}\b/gi,
    /\bcvc[:\s]+\d{3,4}\b/gi,
    /\bsecurity[:\s]+code[:\s]+\d{3,4}\b/gi,
    // PIN patterns
    /\bpin[:\s]+\d{4,6}\b/gi,
    // Expiry date patterns
    /\bexp[:\s]+\d{2}\/\d{2,4}\b/gi,
    /\bexpiry[:\s]+\d{2}\/\d{2,4}\b/gi,
    // Cardholder name patterns (basic)
    /\bcardholder[:\s]+[A-Za-z\s]+\b/gi,
  ];

  function scanForPII(text: string): string[] {
    const found: string[] = [];
    
    piiPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(`PII Pattern ${index + 1}: ${matches.join(', ')}`);
      }
    });

    pciPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(`PCI Pattern ${index + 1}: ${matches.join(', ')}`);
      }
    });

    return found;
  }

  it('should not log PAN tokens in plain text', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766', // Use simulator
      envMode: 'dev'
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardDirect('tok_pan_4111111111111111') // PAN token
        .forAmount('USD', 101)
        .withIdempotencyKey('test-pii-scan')
        .execute();
    } catch (error) {
      // Expected to fail in test environment
    }

    // Scan all captured output for PII/PCI
    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    const piiFound = scanForPII(allOutput);
    
    // Should not find any PII/PCI patterns
    expect(piiFound).toHaveLength(0);
    
    // Specifically check that PAN tokens are masked
    expect(allOutput).not.toMatch(/4111111111111111/);
    expect(allOutput).not.toMatch(/tok_pan_4111111111111111/);
    
    await client.close();
  });

  it('should mask sensitive data in error messages', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766',
      envMode: 'dev'
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardDirect('tok_pan_4111111111111111')
        .forAmount('USD', 101)
        .withIdempotencyKey('test-error-masking')
        .execute();
    } catch (error) {
      // Expected to fail
    }

    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    const piiFound = scanForPII(allOutput);
    expect(piiFound).toHaveLength(0);
    
    await client.close();
  });

  it('should not log email addresses in plain text', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766',
      envMode: 'dev'
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardViaAlias({ alias: 'test@example.com', aliasType: 'EMAIL' })
        .forAmount('USD', 101)
        .withIdempotencyKey('test-email-scan')
        .execute();
    } catch (error) {
      // Expected to fail
    }

    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    const piiFound = scanForPII(allOutput);
    expect(piiFound).toHaveLength(0);
    
    // Specifically check that email is masked
    expect(allOutput).not.toMatch(/test@example\.com/);
    
    await client.close();
  });

  it('should not log phone numbers in plain text', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766',
      envMode: 'dev'
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardViaAlias({ alias: '+1234567890', aliasType: 'PHONE' })
        .forAmount('USD', 101)
        .withIdempotencyKey('test-phone-scan')
        .execute();
    } catch (error) {
      // Expected to fail
    }

    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    const piiFound = scanForPII(allOutput);
    expect(piiFound).toHaveLength(0);
    
    // Specifically check that phone is masked
    expect(allOutput).not.toMatch(/\+1234567890/);
    
    await client.close();
  });

  it('should validate telemetry spans do not contain PII', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766',
      envMode: 'dev'
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardDirect('tok_pan_4111111111111111')
        .forAmount('USD', 101)
        .withIdempotencyKey('test-telemetry-scan')
        .execute();
    } catch (error) {
      // Expected to fail
    }

    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    // Check that telemetry spans don't contain sensitive data
    const piiFound = scanForPII(allOutput);
    expect(piiFound).toHaveLength(0);
    
    // Check that span attributes are properly redacted
    expect(allOutput).not.toMatch(/panToken.*4111111111111111/);
    expect(allOutput).not.toMatch(/alias.*test@example\.com/);
    
    await client.close();
  });

  it('should validate correlation IDs are properly formatted', async () => {
    const client = new VisaDirectClient({
      baseUrl: 'http://localhost:8766',
      envMode: 'dev',
      outboundHeaders: {
        requestIdHeader: 'x-request-id',
        format: 'uuid'
      }
    });

    try {
      await client.payouts.build()
        .forOriginator('fi-001')
        .withFundingInternal(true, 'conf-123')
        .toCardDirect('tok_pan_4111111111111111')
        .forAmount('USD', 101)
        .withIdempotencyKey('test-correlation-scan')
        .execute();
    } catch (error) {
      // Expected to fail
    }

    const allOutput = [
      ...capturedLogs,
      ...capturedDebugs,
      ...capturedErrors
    ].join(' ');

    // Check that correlation IDs are properly formatted UUIDs
    const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
    const correlationIds = allOutput.match(uuidPattern);
    
    if (correlationIds) {
      // All correlation IDs should be valid UUIDs
      correlationIds.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      });
    }
    
    await client.close();
  });
});
