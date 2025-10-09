export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableStatusCodes: number[];
}

export class RetryStrategy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,      // 1 second base delay
      maxDelay: 10000,      // 10 second max delay
      backoffMultiplier: 2,
      jitter: true,
      retryableStatusCodes: [429, 503, 502, 504],
      ...config
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    context?: { operation: string; correlationId?: string }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0 && context) {
          console.log(`[retry] ${context.operation} succeeded on attempt ${attempt + 1}`, {
            correlationId: context.correlationId,
            attempt: attempt + 1
          });
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error, attempt)) {
          throw error;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        
        if (context) {
          console.log(`[retry] ${context.operation} failed on attempt ${attempt + 1}, retrying in ${delay}ms`, {
            correlationId: context.correlationId,
            attempt: attempt + 1,
            error: error.message,
            statusCode: error.response?.status,
            retryAfter: error.response?.headers?.['retry-after']
          });
        }
        
        // Wait before retry
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private isRetryableError(error: any, attempt: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    // Check HTTP status codes
    const statusCode = error.response?.status;
    if (statusCode && this.config.retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // Check for network errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Check for Visa-specific retryable errors
    if (error.retryable === true) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    // Calculate exponential backoff
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getConfig(): RetryConfig {
    return { ...this.config };
  }
}
