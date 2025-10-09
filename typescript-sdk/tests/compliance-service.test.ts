import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceService, ComplianceConfig } from '../src/services/complianceService';

describe('Compliance Service Tests', () => {
  let mockHttpClient: any;
  let complianceService: ComplianceService;

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn()
    };
  });

  describe('Compliance Mode Configuration', () => {
    it('should check compliance for all transactions when mode is "all"', () => {
      const config: ComplianceConfig = {
        mode: 'all',
        enabled: true
      };
      complianceService = new ComplianceService(mockHttpClient, config);

      expect(complianceService.shouldCheckCompliance('US', 'US', 100, 'USD')).toBe(true);
      expect(complianceService.shouldCheckCompliance('US', 'MX', 100, 'USD')).toBe(true);
    });

    it('should only check compliance for cross-border transactions when mode is "cross-border-only"', () => {
      const config: ComplianceConfig = {
        mode: 'cross-border-only',
        enabled: true
      };
      complianceService = new ComplianceService(mockHttpClient, config);

      expect(complianceService.shouldCheckCompliance('US', 'US', 100, 'USD')).toBe(false);
      expect(complianceService.shouldCheckCompliance('US', 'MX', 100, 'USD')).toBe(true);
    });

    it('should not check compliance when mode is "none"', () => {
      const config: ComplianceConfig = {
        mode: 'none',
        enabled: true
      };
      complianceService = new ComplianceService(mockHttpClient, config);

      expect(complianceService.shouldCheckCompliance('US', 'US', 100, 'USD')).toBe(false);
      expect(complianceService.shouldCheckCompliance('US', 'MX', 100, 'USD')).toBe(false);
    });

    it('should not check compliance when disabled', () => {
      const config: ComplianceConfig = {
        mode: 'all',
        enabled: false
      };
      complianceService = new ComplianceService(mockHttpClient, config);

      expect(complianceService.shouldCheckCompliance('US', 'US', 100, 'USD')).toBe(false);
      expect(complianceService.shouldCheckCompliance('US', 'MX', 100, 'USD')).toBe(false);
    });
  });

  describe('Compliance Check Execution', () => {
    beforeEach(() => {
      const config: ComplianceConfig = {
        mode: 'cross-border-only',
        enabled: true
      };
      complianceService = new ComplianceService(mockHttpClient, config);
    });

    it('should return allowed=true for domestic transactions without checking', async () => {
      const result = await complianceService.checkCompliance({
        sourceCountry: 'US',
        targetCountry: 'US',
        amount: 100,
        currency: 'USD',
        originatorId: 'originator-1',
        recipientId: 'recipient-1'
      });

      expect(result.allowed).toBe(true);
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should call compliance service for cross-border transactions', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: {
          allowed: true,
          complianceId: 'comp-123'
        }
      });

      const result = await complianceService.checkCompliance({
        sourceCountry: 'US',
        targetCountry: 'MX',
        amount: 100,
        currency: 'USD',
        originatorId: 'originator-1',
        recipientId: 'recipient-1',
        correlationId: 'corr-123'
      });

      expect(result.allowed).toBe(true);
      expect(result.complianceId).toBe('comp-123');
      expect(mockHttpClient.post).toHaveBeenCalledWith('/compliance/v1/check', {
        transaction: {
          sourceCountry: 'US',
          targetCountry: 'MX',
          amount: {
            value: 100,
            currency: 'USD'
          },
          originatorId: 'originator-1',
          recipientId: 'recipient-1'
        },
        correlationId: 'corr-123',
        timestamp: expect.any(String)
      });
    });

    it('should return allowed=false when compliance service denies transaction', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: {
          allowed: false,
          reason: 'Sanctions match detected',
          complianceId: 'comp-456'
        }
      });

      const result = await complianceService.checkCompliance({
        sourceCountry: 'US',
        targetCountry: 'MX',
        amount: 100,
        currency: 'USD',
        originatorId: 'originator-1',
        recipientId: 'recipient-1'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Sanctions match detected');
      expect(result.complianceId).toBe('comp-456');
    });

    it('should return allowed=false with fail-closed policy when compliance service is unavailable', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Service unavailable'));

      const result = await complianceService.checkCompliance({
        sourceCountry: 'US',
        targetCountry: 'MX',
        amount: 100,
        currency: 'USD',
        originatorId: 'originator-1',
        recipientId: 'recipient-1',
        correlationId: 'corr-123'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Compliance service unavailable - fail-closed policy');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      const config: ComplianceConfig = {
        mode: 'cross-border-only',
        enabled: true,
        denyPath: '/custom/deny'
      };
      complianceService = new ComplianceService(mockHttpClient, config);
    });

    it('should return custom deny path', () => {
      expect(complianceService.getDenyPath()).toBe('/custom/deny');
    });

    it('should update configuration', () => {
      complianceService.updateConfig({
        mode: 'all',
        enabled: false
      });

      const config = complianceService.getConfig();
      expect(config.mode).toBe('all');
      expect(config.enabled).toBe(false);
      expect(config.denyPath).toBe('/custom/deny'); // Should preserve existing values
    });
  });
});
