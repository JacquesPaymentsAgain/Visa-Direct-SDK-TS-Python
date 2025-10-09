import { describe, it, expect } from 'vitest';
import { VISA_ERROR_MAPPINGS, VisaError, mapVisaError, VisaDirectError } from '../src/types/visaErrors';

describe('Error Map Retryability Validation', () => {
  describe('Error Mapping Completeness', () => {
    it('should have all required fields for every error mapping', () => {
      Object.entries(VISA_ERROR_MAPPINGS).forEach(([key, error]) => {
        expect(error.name, `${key}: name is required`).toBeDefined();
        expect(error.name, `${key}: name should not be empty`).not.toBe('');
        
        expect(error.retryable, `${key}: retryable is required`).toBeDefined();
        expect(typeof error.retryable, `${key}: retryable should be boolean`).toBe('boolean');
        
        expect(error.http, `${key}: http status is required`).toBeDefined();
        expect(typeof error.http, `${key}: http status should be number`).toBe('number');
        expect(error.http, `${key}: http status should be valid`).toBeGreaterThan(0);
        
        expect(error.code, `${key}: code is required`).toBeDefined();
        expect(error.code, `${key}: code should not be empty`).not.toBe('');
        
        expect(error.message, `${key}: message is required`).toBeDefined();
        expect(error.message, `${key}: message should not be empty`).not.toBe('');
        
        expect(error.recommendedAction, `${key}: recommendedAction is required`).toBeDefined();
        expect(error.recommendedAction, `${key}: recommendedAction should not be empty`).not.toBe('');
      });
    });

    it('should have consistent retryability patterns', () => {
      // Network errors should be retryable
      expect(VISA_ERROR_MAPPINGS.NETWORK_TIMEOUT.retryable).toBe(true);
      expect(VISA_ERROR_MAPPINGS.NETWORK_ERROR.retryable).toBe(true);
      
      // Authentication errors should not be retryable
      expect(VISA_ERROR_MAPPINGS.UNAUTHORIZED.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.FORBIDDEN.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.CERTIFICATE_INVALID.retryable).toBe(false);
      
      // Validation errors should not be retryable
      expect(VISA_ERROR_MAPPINGS.BAD_REQUEST.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.INVALID_PAN.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.INVALID_AMOUNT.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.INVALID_CURRENCY.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.MISSING_REQUIRED_FIELD.retryable).toBe(false);
      
      // Business logic errors should not be retryable
      expect(VISA_ERROR_MAPPINGS.INSUFFICIENT_FUNDS.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.ACCOUNT_NOT_FOUND.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.CARD_NOT_FOUND.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.WALLET_NOT_FOUND.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.ALIAS_NOT_FOUND.retryable).toBe(false);
      
      // Transaction errors should not be retryable
      expect(VISA_ERROR_MAPPINGS.TRANSACTION_DECLINED.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.DUPLICATE_TRANSACTION.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.TRANSACTION_EXPIRED.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.RECEIPT_REUSED.retryable).toBe(false);
      
      // Compliance errors should not be retryable
      expect(VISA_ERROR_MAPPINGS.COMPLIANCE_DENIED.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.SANCTIONS_MATCH.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.AML_ALERT.retryable).toBe(false);
      
      // FX errors - mixed retryability
      expect(VISA_ERROR_MAPPINGS.FX_RATE_EXPIRED.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.FX_RATE_NOT_FOUND.retryable).toBe(true);
      expect(VISA_ERROR_MAPPINGS.SLIPPAGE_EXCEEDED.retryable).toBe(false);
      
      // System errors should be retryable
      expect(VISA_ERROR_MAPPINGS.ISSUER_UNAVAILABLE.retryable).toBe(true);
      expect(VISA_ERROR_MAPPINGS.ACQUIRER_UNAVAILABLE.retryable).toBe(true);
      expect(VISA_ERROR_MAPPINGS.VISA_SYSTEM_ERROR.retryable).toBe(true);
      expect(VISA_ERROR_MAPPINGS.SERVICE_UNAVAILABLE.retryable).toBe(true);
      
      // Rate limiting should be retryable
      expect(VISA_ERROR_MAPPINGS.RATE_LIMIT_EXCEEDED.retryable).toBe(true);
      
      // MLE/JWE errors - mixed retryability
      expect(VISA_ERROR_MAPPINGS.JWE_ENCRYPT_ERROR.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.JWE_DECRYPT_ERROR.retryable).toBe(false);
      expect(VISA_ERROR_MAPPINGS.JWKS_UNAVAILABLE.retryable).toBe(true);
      
      // Unknown error should not be retryable
      expect(VISA_ERROR_MAPPINGS.UNKNOWN_ERROR.retryable).toBe(false);
    });

    it('should have meaningful recommended actions', () => {
      Object.entries(VISA_ERROR_MAPPINGS).forEach(([key, error]) => {
        // Retryable errors should mention retry in recommended action
        if (error.retryable) {
          expect(error.recommendedAction.toLowerCase(), `${key}: retryable error should mention retry`).toContain('retry');
        }
        
        // Non-retryable errors should mention not retrying
        if (!error.retryable) {
          expect(error.recommendedAction.toLowerCase(), `${key}: non-retryable error should mention not retrying`).toMatch(/do not retry|don't retry|no retry/);
        }
        
        // All actions should be actionable
        expect(error.recommendedAction.length, `${key}: recommended action should be substantial`).toBeGreaterThan(20);
      });
    });

    it('should have valid HTTP status codes', () => {
      Object.entries(VISA_ERROR_MAPPINGS).forEach(([key, error]) => {
        expect(error.http, `${key}: HTTP status should be valid`).toBeGreaterThanOrEqual(100);
        expect(error.http, `${key}: HTTP status should be valid`).toBeLessThanOrEqual(599);
        
        // Common status codes should be used
        const validStatusCodes = [200, 400, 401, 403, 404, 408, 409, 422, 429, 500, 502, 503, 504];
        expect(validStatusCodes, `${key}: HTTP status should be common`).toContain(error.http);
      });
    });

    it('should have unique error codes', () => {
      const codes = Object.values(VISA_ERROR_MAPPINGS).map(error => error.code);
      const uniqueCodes = new Set(codes);
      
      expect(codes.length, 'All error codes should be unique').toBe(uniqueCodes.size);
    });

    it('should have unique error names', () => {
      const names = Object.values(VISA_ERROR_MAPPINGS).map(error => error.name);
      const uniqueNames = new Set(names);
      
      expect(names.length, 'All error names should be unique').toBe(uniqueNames.size);
    });
  });

  describe('Error Mapping Function', () => {
    it('should map exact Visa codes correctly', () => {
      const error = mapVisaError(400, '11', 'Custom message', { rail: 'AFT', corridor: 'US-MX' });
      
      expect(error.code).toBe('11');
      expect(error.name).toBe('InvalidPan');
      expect(error.retryable).toBe(false);
      expect(error.http).toBe(400);
      expect(error.message).toBe('Invalid PAN token format'); // Should use the mapped message, not custom
      expect(error.rail).toBe('AFT');
      expect(error.corridor).toBe('US-MX');
      expect(error.recommendedAction).toBe('Validate PAN token format. Do not retry.');
    });

    it('should fall back to HTTP status mapping', () => {
      const error = mapVisaError(404, 'UNKNOWN_CODE', 'Not found', { rail: 'OCT' });
      
      expect(error.code).toBe('21');
      expect(error.name).toBe('AccountNotFound');
      expect(error.retryable).toBe(false);
      expect(error.http).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.rail).toBe('OCT');
      expect(error.recommendedAction).toBe('Verify account ID. Do not retry.');
    });

    it('should handle unknown HTTP status codes', () => {
      const error = mapVisaError(999, undefined, 'Unknown error');
      
      expect(error.code).toBe('99');
      expect(error.name).toBe('UnknownError');
      expect(error.retryable).toBe(false);
      expect(error.http).toBe(500); // Should map to 500 for unknown status codes
      expect(error.message).toBe('Unknown error');
      expect(error.recommendedAction).toBe('Contact support with error details. Do not retry.');
    });

    it('should preserve context information', () => {
      const error = mapVisaError(503, 'NETWORK', 'Network error', { 
        rail: 'AFT', 
        corridor: 'US-CA' 
      });
      
      expect(error.rail).toBe('AFT');
      expect(error.corridor).toBe('US-CA');
    });
  });

  describe('Error Class Functionality', () => {
    it('should create VisaDirectError with all properties', () => {
      const errorDetail = VISA_ERROR_MAPPINGS.NETWORK_TIMEOUT;
      const error = new VisaDirectError(errorDetail, 408, 'TIMEOUT');
      
      expect(error.name).toBe('NetworkTimeout');
      expect(error.message).toBe('Request timeout - network connectivity issue');
      expect(error.httpStatus).toBe(408);
      expect(error.visaCode).toBe('TIMEOUT');
      expect(error.isRetryable).toBe(true);
      expect(error.recommendedAction).toBe('Retry with exponential backoff. Check network connectivity.');
    });

    it('should provide convenient access to retryability', () => {
      const retryableError = new VisaDirectError(VISA_ERROR_MAPPINGS.NETWORK_TIMEOUT, 408, 'TIMEOUT');
      
      const nonRetryableError = new VisaDirectError(VISA_ERROR_MAPPINGS.UNAUTHORIZED, 401, '01');
      
      expect(retryableError.isRetryable).toBe(true);
      expect(nonRetryableError.isRetryable).toBe(false);
    });
  });
});
