export type ComplianceMode = 'all' | 'cross-border-only' | 'none';

export interface ComplianceConfig {
  mode: ComplianceMode;
  enabled: boolean;
  denyPath?: string; // Custom deny path for compliance failures
}

export class ComplianceService {
  private config: ComplianceConfig;
  private httpClient: any; // SecureHttpClient

  constructor(httpClient: any, config: ComplianceConfig) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * Determines if compliance checks should be performed for a given transaction
   */
  shouldCheckCompliance(sourceCountry: string, targetCountry: string, amount: number, currency: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    switch (this.config.mode) {
      case 'none':
        return false;
      
      case 'cross-border-only':
        return sourceCountry !== targetCountry;
      
      case 'all':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Performs compliance checks and returns result
   */
  async checkCompliance(transactionData: {
    sourceCountry: string;
    targetCountry: string;
    amount: number;
    currency: string;
    originatorId: string;
    recipientId: string;
    correlationId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    complianceId?: string;
  }> {
    if (!this.shouldCheckCompliance(
      transactionData.sourceCountry,
      transactionData.targetCountry,
      transactionData.amount,
      transactionData.currency
    )) {
      return { allowed: true };
    }

    try {
      const compliancePayload = {
        transaction: {
          sourceCountry: transactionData.sourceCountry,
          targetCountry: transactionData.targetCountry,
          amount: {
            value: transactionData.amount,
            currency: transactionData.currency
          },
          originatorId: transactionData.originatorId,
          recipientId: transactionData.recipientId
        },
        correlationId: transactionData.correlationId,
        timestamp: new Date().toISOString()
      };

      const response = await this.httpClient.post('/compliance/v1/check', compliancePayload);
      
      return {
        allowed: response.data.allowed === true,
        reason: response.data.reason,
        complianceId: response.data.complianceId
      };
    } catch (error: any) {
      // If compliance service is unavailable, follow fail-closed policy
      console.warn('Compliance service unavailable, denying transaction', {
        error: error.message,
        correlationId: transactionData.correlationId
      });

      return {
        allowed: false,
        reason: 'Compliance service unavailable - fail-closed policy'
      };
    }
  }

  /**
   * Gets the deny path for compliance failures
   */
  getDenyPath(): string {
    return this.config.denyPath || '/compliance/v1/deny';
  }

  /**
   * Updates compliance configuration
   */
  updateConfig(newConfig: Partial<ComplianceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current compliance configuration
   */
  getConfig(): ComplianceConfig {
    return { ...this.config };
  }
}