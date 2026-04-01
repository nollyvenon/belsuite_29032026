/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 * Prevents cascading failures by stopping calls to failing services
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  /**
   * Circuit is closed - all requests pass through
   */
  CLOSED = 'CLOSED',

  /**
   * Circuit is open - all requests fail immediately
   */
  OPEN = 'OPEN',

  /**
   * Circuit is half-open - testing if service recovered
   */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration for circuit breaker
 */
export interface CircuitBreakerConfig {
  /**
   * Name of the circuit breaker (for logging)
   */
  name: string;

  /**
   * Number of failures before opening circuit
   */
  failureThreshold: number;

  /**
   * Number of successful calls before closing circuit (in HALF_OPEN state)
   */
  successThreshold: number;

  /**
   * Timeout in milliseconds before transitioning from OPEN to HALF_OPEN
   */
  timeout: number;

  /**
   * Monitor interval in milliseconds
   */
  monitorInterval?: number;
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastStateChange: Date;
  totalStateChanges: number;
}

/**
 * Generic Circuit Breaker implementation
 */
@Injectable()
export class CircuitBreaker<T> {
  private logger: Logger;

  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastErrorTime?: Date;
  private lastStateChangeTime: Date = new Date();

  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    lastStateChange: new Date(),
    totalStateChanges: 0,
  };

  private mockState?: CircuitBreakerState;

  constructor(private readonly config: CircuitBreakerConfig) {
    this.logger = new Logger(`CircuitBreaker:${config.name}`);
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn The async function to execute
   * @returns The result of the function or throws CircuitBreakerOpenError
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if circuit should transition
    this.checkStateTransition();

    // If circuit is OPEN, reject immediately
    if (this.state === CircuitBreakerState.OPEN) {
      this.metrics.rejectedRequests++;
      throw new CircuitBreakerOpenError(
        `Circuit breaker "${this.config.name}" is OPEN`,
      );
    }

    try {
      // Execute the protected function
      const result = await fn();

      // Record success
      this.onSuccess();
      this.metrics.successfulRequests++;

      return result;
    } catch (error) {
      // Record failure
      this.onFailure();
      this.metrics.failedRequests++;

      throw error;
    }
  }

  /**
   * Check if state should transition based on timing & counts
   */
  private checkStateTransition(): void {
    const now = new Date();
    const timeSinceLastChange = now.getTime() - this.lastStateChangeTime.getTime();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        // No action needed - circuit is healthy
        break;

      case CircuitBreakerState.OPEN:
        // Check if timeout has passed and transition to HALF_OPEN
        if (timeSinceLastChange > this.config.timeout) {
          this.setState(CircuitBreakerState.HALF_OPEN);
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        // Check if we have enough data to decide
        // In HALF_OPEN, we test the service with a limited number of requests
        // If success threshold reached, close the circuit
        // If failure threshold reached, reopen the circuit
        break;
    }
  }

  /**
   * Record successful call
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.metrics.consecutiveSuccesses++;
    this.metrics.consecutiveFailures = 0;

    this.logger.debug(
      `Success recorded. State: ${this.state}, SuccessCount: ${this.successCount}`,
    );

    // Transition from HALF_OPEN to CLOSED if we've had enough successes
    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.successCount >= this.config.successThreshold
    ) {
      this.setState(CircuitBreakerState.CLOSED);
      this.successCount = 0;
    }
  }

  /**
   * Record failed call
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    this.lastErrorTime = new Date();
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;

    this.logger.warn(
      `Failure recorded. State: ${this.state}, FailureCount: ${this.failureCount}/${this.config.failureThreshold}`,
    );

    // Transition from CLOSED to OPEN if we've exceeded failure threshold
    if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.setState(CircuitBreakerState.OPEN);
    }

    // Transition from HALF_OPEN back to OPEN if we fail
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.setState(CircuitBreakerState.OPEN);
      this.failureCount = 0;
    }
  }

  /**
   * Transition to new state
   */
  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      this.logger.warn(
        `Circuit breaker state transition: ${this.state} → ${newState}`,
      );

      this.state = newState;
      this.lastStateChangeTime = new Date();
      this.metrics.lastStateChange = new Date();
      this.metrics.totalStateChanges++;

      // Reset counts when state changes
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.mockState ?? this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.logger.log(`Resetting circuit breaker "${this.config.name}"`);

    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastErrorTime = undefined;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastStateChange: new Date(),
      totalStateChanges: 0,
    };
  }

  /**
   * Force state change (for testing)
   */
  forceState(state: CircuitBreakerState): void {
    this.logger.warn(
      `Force setting circuit breaker state to ${state} (should only be used for testing)`,
    );
    this.mockState = state;
  }

  /**
   * Clear forced state (for testing)
   */
  clearForcedState(): void {
    this.mockState = undefined;
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Manager for multiple circuit breakers
 */
@Injectable()
export class CircuitBreakerManager {
  private readonly logger = new Logger(CircuitBreakerManager.name);
  private breakers: Map<string, CircuitBreaker<any>> = new Map();

  /**
   * Create or get a circuit breaker
   */
  getBreaker<T>(config: CircuitBreakerConfig): CircuitBreaker<T> {
    if (!this.breakers.has(config.name)) {
      this.breakers.set(config.name, new CircuitBreaker<T>(config));
      this.logger.debug(`Created circuit breaker: ${config.name}`);
    }

    return this.breakers.get(config.name)!;
  }

  /**
   * Get all circuit breakers and their states
   */
  getAllBreakers(): Map<string, { state: CircuitBreakerState; metrics: CircuitBreakerMetrics }> {
    const result = new Map();

    this.breakers.forEach((breaker, name) => {
      result.set(name, {
        state: breaker.getState(),
        metrics: breaker.getMetrics(),
      });
    });

    return result;
  }

  /**
   * Reset a specific circuit breaker
   */
  resetBreaker(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
    this.logger.log('Reset all circuit breakers');
  }
}
