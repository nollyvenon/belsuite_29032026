/**
 * Cost Optimizer Service
 * Selects the cheapest/fastest/best-quality model for a given task
 * based on live cost data from the model registry.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  RegisteredModel,
  RoutingStrategy,
  RoutingPreferences,
} from '../types/gateway.types';

export interface ModelScore {
  model: RegisteredModel;
  costScore:    number;   // 0–1 (1 = cheapest)
  qualityScore: number;   // 0–1
  speedScore:   number;   // 0–1
  compositeScore: number; // weighted
  estimatedCostUsd: number; // for the request
}

export interface CostComparison {
  modelId:          string;
  displayName:      string;
  provider:         string;
  estimatedCostUsd: number;
  inputCostUsd:     number;
  outputCostUsd:    number;
  qualityScore:     number;
  speedScore:       number;
  isEnabled:        boolean;
}

@Injectable()
export class CostOptimizerService {
  private readonly logger = new Logger(CostOptimizerService.name);

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Select the best model from a list based on preferences.
   * Returns null if no model satisfies the constraints.
   */
  selectModel(
    candidates: RegisteredModel[],
    prefs: RoutingPreferences,
    estimatedInputTokens = 500,
    estimatedOutputTokens = 500,
  ): RegisteredModel | null {
    if (candidates.length === 0) return null;

    const scored = this.scoreModels(
      candidates,
      prefs,
      estimatedInputTokens,
      estimatedOutputTokens,
    );

    if (scored.length === 0) return null;

    this.logger.debug(
      `Cost optimizer selected: ${scored[0].model.displayName} ` +
      `(score: ${scored[0].compositeScore.toFixed(3)}, ` +
      `est. cost: $${scored[0].estimatedCostUsd.toFixed(6)})`,
    );

    return scored[0].model;
  }

  /**
   * Full cost breakdown for all candidates — used by admin analytics.
   */
  compareProviders(
    candidates: RegisteredModel[],
    estimatedInputTokens = 500,
    estimatedOutputTokens = 500,
  ): CostComparison[] {
    return candidates.map(m => ({
      modelId:          m.id,
      displayName:      m.displayName,
      provider:         m.provider,
      estimatedCostUsd: this.estimateCost(m, estimatedInputTokens, estimatedOutputTokens),
      inputCostUsd:     (estimatedInputTokens * m.costPerInputToken),
      outputCostUsd:    (estimatedOutputTokens * m.costPerOutputToken),
      qualityScore:     m.qualityScore,
      speedScore:       m.speedScore,
      isEnabled:        m.isEnabled,
    })).sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);
  }

  estimateCost(
    model: RegisteredModel,
    inputTokens: number,
    outputTokens: number,
  ): number {
    return (
      inputTokens  * model.costPerInputToken  +
      outputTokens * model.costPerOutputToken
    );
  }

  estimateCostFromText(model: RegisteredModel, promptText: string, maxOutputTokens = 500): number {
    const inputTokens = Math.ceil(promptText.length / 4);
    return this.estimateCost(model, inputTokens, maxOutputTokens);
  }

  // ── Scoring ────────────────────────────────────────────────────────────

  private scoreModels(
    candidates: RegisteredModel[],
    prefs: RoutingPreferences,
    inputTokens: number,
    outputTokens: number,
  ): ModelScore[] {
    // Apply hard constraints
    const eligible = candidates.filter(m => {
      if (prefs.preferredProviders?.length && !prefs.preferredProviders.includes(m.provider)) {
        return false;
      }
      if (prefs.excludedModels?.includes(m.id)) {
        return false;
      }
      if (prefs.requireCapabilities?.length) {
        const hasAll = prefs.requireCapabilities.every(cap => m.capabilities.includes(cap));
        if (!hasAll) return false;
      }
      return true;
    });

    if (eligible.length === 0) return this.scoreModels(candidates, { strategy: prefs.strategy }, inputTokens, outputTokens);

    const costs = eligible.map(m => this.estimateCost(m, inputTokens, outputTokens));
    const maxCost = Math.max(...costs, 0.000001);

    const scored: ModelScore[] = eligible.map((model, i) => {
      const cost = costs[i];

      // Filter by max cost constraint
      if (prefs.maxCostUsdPerRequest && cost > prefs.maxCostUsdPerRequest) {
        return null;
      }

      const costScore    = 1 - (cost / maxCost);
      const qualityScore = model.qualityScore;
      const speedScore   = model.speedScore;
      const composite    = this.weightedScore(prefs.strategy, costScore, qualityScore, speedScore);

      return { model, costScore, qualityScore, speedScore, compositeScore: composite, estimatedCostUsd: cost };
    }).filter((s): s is ModelScore => s !== null);

    return scored.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  private weightedScore(
    strategy: RoutingStrategy,
    costScore: number,
    qualityScore: number,
    speedScore: number,
  ): number {
    const weights: Record<RoutingStrategy, [number, number, number]> = {
      cheapest:     [0.70, 0.20, 0.10],
      fastest:      [0.10, 0.10, 0.80],
      best_quality: [0.10, 0.80, 0.10],
      balanced:     [0.33, 0.34, 0.33],
      custom:       [0.33, 0.34, 0.33],
    };
    const [wc, wq, ws] = weights[strategy] ?? [0.33, 0.34, 0.33];
    return wc * costScore + wq * qualityScore + ws * speedScore;
  }
}
