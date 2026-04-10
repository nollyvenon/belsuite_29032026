/**
 * AI Gateway — Public Controller
 * Exposes REST endpoints consumed by BelSuite feature modules.
 *
 * POST /ai-gateway/generate          — single text/image generation
 * POST /ai-gateway/batch             — parallel batch generation
 * GET  /ai-gateway/budget/:orgId     — budget status for an org
 * GET  /ai-gateway/health            — provider health summary
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AIGatewayService }    from '../ai-gateway.service';
import { UsageTrackerService } from '../services/usage-tracker.service';
import { FailoverService }     from '../services/failover.service';
import { ModelRegistryService } from '../services/model-registry.service';
import { GenerateTextDto, BatchGenerateDto } from '../dto/gateway.dto';
import { GatewayRequest }      from '../types/gateway.types';

@Controller('ai-gateway')
export class AIGatewayController {
  private readonly logger = new Logger(AIGatewayController.name);

  constructor(
    private readonly gateway:   AIGatewayService,
    private readonly usage:     UsageTrackerService,
    private readonly failover:  FailoverService,
    private readonly registry:  ModelRegistryService,
  ) {}

  /**
   * Generate text (or an image URL) from a prompt.
   * The gateway handles model selection, caching, and failover automatically.
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Body() dto: GenerateTextDto) {
    const req: GatewayRequest = {
      organizationId: dto.organizationId,
      userId:         dto.userId,
      task:           dto.task,
      feature:        dto.feature,
      prompt:         dto.prompt,
      systemPrompt:   dto.systemPrompt,
      maxTokens:      dto.maxTokens,
      temperature:    dto.temperature,
      useCache:       dto.useCache,
      cacheTtlSeconds: dto.cacheTtlSeconds,
      routing:        dto.routing,
      metadata:       dto.metadata,
      conversationHistory: dto.conversationHistory,
    };

    return this.gateway.generate(req);
  }

  /**
   * Batch generation — runs up to 10 prompts in parallel.
   * Returns results in the same order as inputs; failed items contain `error`.
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async batch(@Body() dto: BatchGenerateDto) {
    const results = await Promise.allSettled(
      dto.requests.map(r => this.gateway.generate({
        ...r,
        organizationId: dto.organizationId,
        userId:         dto.userId,
      })),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? { index: i, success: true,  result: r.value }
        : { index: i, success: false, error: r.reason?.message ?? 'unknown' },
    );
  }

  /**
   * Budget status for an organisation.
   */
  @Get('budget/:organizationId')
  async getBudgetStatus(@Param('organizationId') orgId: string) {
    return this.usage.getBudgetStatus(orgId);
  }

  /**
   * Provider health — useful for feature-level health checks.
   */
  @Get('health')
  async getHealth() {
    const models = await this.registry.getAllModels();
    return this.failover.getAllHealth(models);
  }
}
