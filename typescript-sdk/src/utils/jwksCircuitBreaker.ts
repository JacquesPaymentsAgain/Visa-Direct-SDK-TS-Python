export interface CircuitBreakerState {
  failCount: number;
  openedUntil: number;
  lastFailureTime: number;
}

export class JwksCircuitBreaker {
  private state: CircuitBreakerState = {
    failCount: 0,
    openedUntil: 0,
    lastFailureTime: 0
  };

  private readonly maxFailures: number;
  private readonly timeoutMs: number;
  private readonly resetTimeoutMs: number;

  constructor(options: {
    maxFailures?: number;
    timeoutMs?: number;
    resetTimeoutMs?: number;
  } = {}) {
    this.maxFailures = options.maxFailures || 3;
    this.timeoutMs = options.timeoutMs || 30000; // 30 seconds
    this.resetTimeoutMs = options.resetTimeoutMs || 60000; // 1 minute
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error(`JWKS circuit breaker is open. Will retry after ${new Date(this.state.openedUntil).toISOString()}`);
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('JWKS operation timeout')), this.timeoutMs)
        )
      ]);

      // Success - reset circuit breaker
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    const now = Date.now();
    
    // Check if we're in the opened state
    if (this.state.openedUntil > now) {
      return true;
    }

    // Check if we should reset the circuit breaker
    if (this.state.failCount >= this.maxFailures && 
        (now - this.state.lastFailureTime) > this.resetTimeoutMs) {
      this.reset();
      return false;
    }

    return this.state.failCount >= this.maxFailures;
  }

  private onSuccess(): void {
    this.state.failCount = 0;
    this.state.openedUntil = 0;
  }

  private onFailure(): void {
    this.state.failCount++;
    this.state.lastFailureTime = Date.now();
    
    if (this.state.failCount >= this.maxFailures) {
      this.state.openedUntil = Date.now() + this.resetTimeoutMs;
    }
  }

  private reset(): void {
    this.state.failCount = 0;
    this.state.openedUntil = 0;
    this.state.lastFailureTime = 0;
  }

  public getState(): CircuitBreakerState {
    return { ...this.state };
  }

  public isHealthy(): boolean {
    return this.state.failCount < this.maxFailures;
  }
}
