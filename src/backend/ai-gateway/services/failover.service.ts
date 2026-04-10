/**
 * Failover Service — Circuit Breaker Pattern
 *
 * States:
 *   CLOSED    → normal operation, requests flow through
 *   OPEN      → too many failures, fast-fail for RESET_TIMEOUT_MS
 *   HALF_OPEN → one test request allowed to check recovery
 *
 * Thresholds are configurable per model.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProviderHealth, CircuitState, RegisteredModel } from '../types/gateway.types';

const FAILURE_THRESHOLD    = 5;       // consecutive failures to open circuit
const RESET_TIMEOUT_MS     = 60_000;  // 1 minute before HALF_OPEN
const LATENCY_WINDOW       = 100;     // samples for rolling avg
const SUCCESS_TO_CLOSE     = 2;       // successes in HALF_OPEN to reclose

interface CircuitBreaker {
  modelId:              string;
  state:                CircuitState;
  consecutiveFailures:  number;
  halfOpenSuccesses:    number;
  openedAt?:            number;
  nextRetryAt?:         number;
  latencySamples:       number[];
  totalRequests:        number;
  totalFailures:        number;
  lastSuccessAt?:       Date;
  lastFailureAt?:       Date;
  lastError?:           string;
}

@Injectable()
export class FailoverService {
  private readonly logger = new Logger(FailoverService.name);
  /** In-memory circuit breakers — persisted to DB asynchronously */
  private circuits = new Map<string, CircuitBreaker>();

  constructor(private prisma: PrismaService) {}

  // ── Circuit state ──────────────────────────────────────────────────────

  canAttempt(modelId: string): boolean {
    const circuit = this.getOrCreate(modelId);
    const now = Date.now();

    if (circuit.state === 'CLOSED') return true;

    if (circuit.state === 'OPEN') {
      if (circuit.nextRetryAt && now >= circuit.nextRetryAt) {
        circuit.state             = 'HALF_OPEN';
        circuit.halfOpenSuccesses = 0;
        this.logger.log(`Circuit HALF_OPEN for model ${modelId}`);
        return true; // allow one test request
      }
      return false;  // still open
    }

    // HALF_OPEN — allow one test request at a time
    return circuit.halfOpenSuccesses < SUCCESS_TO_CLOSE;
  }

  recordSuccess(modelId: string, latencyMs: number): void {
    const circuit = this.getOrCreate(modelId);
    circuit.consecutiveFailures = 0;
    circuit.totalRequests++;
    circuit.lastSuccessAt = new Date();

    // Rolling latency
    circuit.latencySamples.push(latencyMs);
    if (circuit.latencySamples.length > LATENCY_WINDOW) {
      circuit.latencySamples.shift();
    }

    if (circuit.state === 'HALF_OPEN') {
      circuit.halfOpenSuccesses++;
      if (circuit.halfOpenSuccesses >= SUCCESS_TO_CLOSE) {
        circuit.state = 'CLOSED';
        this.logger.log(`Circuit CLOSED (recovered) for model ${modelId}`);
      }
    }

    this.persistHealth(modelId).catch(() => {});
  }

  recordFailure(modelId: string, error: string): void {
    const circuit = this.getOrCreate(modelId);
    circuit.consecutiveFailures++;
    circuit.totalFailures++;
    circuit.totalRequests++;
    circuit.lastFailureAt = new Date();
    circuit.lastError     = error.slice(0, 500);

    if (circuit.state === 'HALF_OPEN') {
      // Failed during recovery — reopen
      this.openCircuit(circuit);
    } else if (circuit.consecutiveFailures >= FAILURE_THRESHOLD) {
      this.openCircuit(circuit);
    }

    this.persistHealth(modelId).catch(() => {});
  }

  // ── Health inspection ──────────────────────────────────────────────────

  getHealth(modelId: string, model?: RegisteredModel): ProviderHealth {
    const circuit = this.getOrCreate(modelId);
    const latencies = circuit.latencySamples;
    const avg   = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95   = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    const successRate = circuit.totalRequests > 0
      ? ((circuit.totalRequests - circuit.totalFailures) / circuit.totalRequests) * 100
      : 100;

    return {
      modelId,
      modelDisplayName: model?.displayName ?? modelId,
      provider:         model?.provider    ?? (null as any),
      isHealthy:        circuit.state !== 'OPEN',
      circuitState:     circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      successRatePct:   Math.round(successRate * 10) / 10,
      avgLatencyMs:     Math.round(avg),
      p95LatencyMs:     Math.round(p95),
      totalRequests:    circuit.totalRequests,
      totalFailures:    circuit.totalFailures,
      lastSuccessAt:    circuit.lastSuccessAt,
      lastFailureAt:    circuit.lastFailureAt,
      lastError:        circuit.lastError,
      nextRetryAt:      circuit.nextRetryAt ? new Date(circuit.nextRetryAt) : undefined,
    };
  }

  getAllHealth(models: RegisteredModel[]): ProviderHealth[] {
    return models.map(m => this.getHealth(m.id, m));
  }

  getHealthyModels(models: RegisteredModel[]): RegisteredModel[] {
    return models.filter(m => this.canAttempt(m.id));
  }

  resetCircuit(modelId: string): void {
    const circuit = this.getOrCreate(modelId);
    circuit.state               = 'CLOSED';
    circuit.consecutiveFailures = 0;
    circuit.halfOpenSuccesses   = 0;
    circuit.openedAt            = undefined;
    circuit.nextRetryAt         = undefined;
    this.logger.log(`Circuit manually RESET for model ${modelId}`);
    this.persistHealth(modelId).catch(() => {});
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private getOrCreate(modelId: string): CircuitBreaker {
    if (!this.circuits.has(modelId)) {
      this.circuits.set(modelId, {
        modelId,
        state:               'CLOSED',
        consecutiveFailures: 0,
        halfOpenSuccesses:   0,
        latencySamples:      [],
        totalRequests:       0,
        totalFailures:       0,
      });
    }
    return this.circuits.get(modelId)!;
  }

  private openCircuit(circuit: CircuitBreaker): void {
    circuit.state       = 'OPEN';
    circuit.openedAt    = Date.now();
    circuit.nextRetryAt = Date.now() + RESET_TIMEOUT_MS;
    this.logger.warn(
      `Circuit OPENED for model ${circuit.modelId} — ` +
      `${circuit.consecutiveFailures} consecutive failures`,
    );
  }

  private async persistHealth(modelId: string): Promise<void> {
    const circuit = this.circuits.get(modelId);
    if (!circuit) return;

    const latencies = circuit.latencySamples;
    const avg   = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95   = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    const successRate = circuit.totalRequests > 0
      ? ((circuit.totalRequests - circuit.totalFailures) / circuit.totalRequests) * 100
      : 100;

    try {
      await this.prisma.aIProviderHealth.upsert({
        where:  { modelId },
        update: {
          isHealthy:           circuit.state !== 'OPEN',
          consecutiveFailures: circuit.consecutiveFailures,
          lastSuccessAt:       circuit.lastSuccessAt,
          lastFailureAt:       circuit.lastFailureAt,
          lastError:           circuit.lastError,
          avgLatencyMs:        avg,
          p95LatencyMs:        p95,
          successRatePct:      successRate,
          totalRequests:       circuit.totalRequests,
          totalFailures:       circuit.totalFailures,
          circuitBreakerState: circuit.state,
          circuitOpenedAt:     circuit.openedAt ? new Date(circuit.openedAt) : null,
          nextRetryAt:         circuit.nextRetryAt ? new Date(circuit.nextRetryAt) : null,
        },
        create: {
          modelId,
          isHealthy:           circuit.state !== 'OPEN',
          consecutiveFailures: circuit.consecutiveFailures,
          lastSuccessAt:       circuit.lastSuccessAt,
          lastFailureAt:       circuit.lastFailureAt,
          lastError:           circuit.lastError,
          avgLatencyMs:        avg,
          p95LatencyMs:        p95,
          successRatePct:      successRate,
          totalRequests:       circuit.totalRequests,
          totalFailures:       circuit.totalFailures,
          circuitBreakerState: circuit.state,
          circuitOpenedAt:     circuit.openedAt ? new Date(circuit.openedAt) : null,
          nextRetryAt:         circuit.nextRetryAt ? new Date(circuit.nextRetryAt) : null,
        },
      });
    } catch {
      // Don't fail requests just because health persistence failed
    }
  }
}
