/**
 * Task Router Service
 * Maps GatewayTask → required capabilities → eligible models.
 * Respects feature-level model overrides from the registry.
 * Returns an ordered list: [primary, ...fallbacks] for the gateway to attempt.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GatewayTask,
  RegisteredModel,
  RoutingPreferences,
} from '../types/gateway.types';
import { ModelRegistryService }  from './model-registry.service';
import { CostOptimizerService }  from './cost-optimizer.service';
import { FailoverService }       from './failover.service';

/** Which capabilities a task needs — at least one model must have them all */
const TASK_CAPABILITY_MAP: Record<GatewayTask, string[]> = {
  [GatewayTask.CONTENT_LONG_FORM]:   ['text'],
  [GatewayTask.AD_COPY]:             ['text'],
  [GatewayTask.EMAIL_DRAFT]:         ['text'],
  [GatewayTask.VIDEO_SCRIPT]:        ['text'],
  [GatewayTask.SOCIAL_POST]:         ['text'],
  [GatewayTask.SEO_ANALYSIS]:        ['text'],
  [GatewayTask.SUMMARIZATION]:       ['text'],
  [GatewayTask.TRANSLATION]:         ['text'],
  [GatewayTask.CLASSIFICATION]:      ['text'],
  [GatewayTask.CODE_GENERATION]:     ['text', 'code'],
  [GatewayTask.BUSINESS_INSIGHTS]:   ['text'],
  [GatewayTask.IMAGE_GENERATION]:    ['image_generation'],
  [GatewayTask.IMAGE_EDIT]:          ['image_generation'],
  [GatewayTask.CHAT]:                ['text'],
  [GatewayTask.MODERATION]:          ['moderation'],
  [GatewayTask.EMBEDDING]:           ['embedding'],
  [GatewayTask.AUDIO_TRANSCRIPTION]: ['audio'],
  [GatewayTask.CUSTOM]:              [],
};

export interface RoutingPlan {
  /** Ordered candidates — gateway will try each in sequence on failure */
  candidates: RegisteredModel[];
  /** Required capabilities derived from the task */
  requiredCapabilities: string[];
  /** Whether a feature-level override was applied */
  featureOverrideApplied: boolean;
}

@Injectable()
export class TaskRouterService {
  private readonly logger = new Logger(TaskRouterService.name);

  constructor(
    private readonly registry:  ModelRegistryService,
    private readonly optimizer: CostOptimizerService,
    private readonly failover:  FailoverService,
  ) {}

  /**
   * Build a routing plan for a given task + feature.
   * 1. Check for explicit feature-level model assignment.
   * 2. Score all enabled/healthy models and return ordered list.
   */
  async buildPlan(
    task:    GatewayTask,
    feature: string,
    prefs:   RoutingPreferences,
    estimatedInputTokens  = 500,
    estimatedOutputTokens = 500,
  ): Promise<RoutingPlan> {
    const requiredCapabilities = TASK_CAPABILITY_MAP[task] ?? [];

    // ── Step 1: feature-level override ────────────────────────────────────
    const featureAssignments = await this.registry.getFeatureAssignments();
    const featureAssignment  = featureAssignments.find(
      (a: any) => a.feature === feature,
    );

    let featureOverrideApplied = false;
    let primaryModel: RegisteredModel | null = null;

    if (featureAssignment?.primaryModelId) {
      const allModels = await this.registry.getAllModels();
      primaryModel = allModels.find(
        m => m.id === featureAssignment.primaryModelId && m.isEnabled,
      ) ?? null;

      if (primaryModel && this.failover.canAttempt(primaryModel.id)) {
        featureOverrideApplied = true;
        this.logger.debug(
          `Feature override: ${feature} → ${primaryModel.displayName}`,
        );
      } else {
        // Assigned model unhealthy — clear override, fall through to scoring
        if (primaryModel) {
          this.logger.warn(
            `Feature override model ${primaryModel.displayName} is unhealthy — falling back to scoring`,
          );
        }
        primaryModel = null;
      }
    }

    // ── Step 2: eligible pool (healthy + capability-matched) ───────────────
    const taskModels = await this.registry.getEnabledModelsForTask(task);
    const healthy    = this.failover.getHealthyModels(taskModels);

    // ── Step 3: score the healthy pool (excluding primary already chosen) ──
    const excludeIds = new Set(primaryModel ? [primaryModel.id] : []);
    const scoringPool = healthy.filter(m => !excludeIds.has(m.id));

    const scored = this.optimizer.selectModel(
      scoringPool,
      { ...prefs, requireCapabilities: requiredCapabilities },
      estimatedInputTokens,
      estimatedOutputTokens,
    );

    // ── Step 4: build ordered candidate list ──────────────────────────────
    const candidates: RegisteredModel[] = [];
    if (primaryModel) candidates.push(primaryModel);
    if (scored)       candidates.push(scored);

    // Add remaining healthy models as further fallbacks
    const usedIds = new Set(candidates.map(c => c.id));
    const remaining = healthy
      .filter(m => !usedIds.has(m.id))
      .sort((a, b) =>
        this.optimizer.estimateCost(b, estimatedInputTokens, estimatedOutputTokens) -
        this.optimizer.estimateCost(a, estimatedInputTokens, estimatedOutputTokens),
      );
    candidates.push(...remaining);

    if (candidates.length === 0) {
      this.logger.warn(
        `No eligible models for task=${task} feature=${feature}. ` +
        `Tried ${taskModels.length} models, ${healthy.length} healthy.`,
      );
    }

    return { candidates, requiredCapabilities, featureOverrideApplied };
  }

  /** Returns task → capability requirements map (for admin inspection) */
  getTaskCapabilityMap(): Record<string, string[]> {
    return { ...TASK_CAPABILITY_MAP };
  }
}
