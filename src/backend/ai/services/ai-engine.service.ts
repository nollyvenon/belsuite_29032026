/**
 * AI Engine Service - Main Orchestration
 * Manages model routing, caching, cost tracking, and API integration
 */

import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/context/request-context.service';
import { EventBus } from '../../common/events/event.bus';
import { AnalyticsEventEmittedEvent } from '../../common/events/event.types';
import { CircuitBreakerManager } from '../../common/resilience/circuit-breaker';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AIGenerationRequest, AIGenerationResponse, AIModel, AIProvider, AITaskType, AIUsageMetrics } from '../types/ai.types';
import { GenerateContentDto, UseTemplateDto, CreateTemplateDto } from '../dto/ai.dto';
import { OpenAIProvider } from '../providers/openai.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AIEngineService {
  private readonly logger = new Logger(AIEngineService.name);

  /**
   * In-memory cache (production: use Redis)
   */
  private cache: Map<string, { response: AIGenerationResponse; expiresAt: Date }> = new Map();

  /**
   * Model pricing per 1M tokens
   */
  private readonly pricing: Record<AIModel, { input: number; output: number }> = {
    [AIModel.GPT_4_TURBO]: { input: 10, output: 30 },
    [AIModel.GPT_4]: { input: 30, output: 60 },
    [AIModel.GPT_3_5_TURBO]: { input: 0.5, output: 1.5 },
    [AIModel.CLAUDE_3_OPUS]: { input: 15, output: 75 },
    [AIModel.CLAUDE_3_SONNET]: { input: 3, output: 15 },
    [AIModel.CLAUDE_3_HAIKU]: { input: 0.25, output: 1.25 },
  } as any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: RequestContextService,
    private readonly eventBus: EventBus,
    private readonly circuitBreakerManager: CircuitBreakerManager,
    private readonly openaiProvider: OpenAIProvider,
    private readonly claudeProvider: ClaudeProvider,
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

  /**
   * Generate content with intelligent provider routing
   */
  async generateContent(dto: GenerateContentDto): Promise<AIGenerationResponse> {
    const organizationId = this.contextService.getTenantId()!;
    const userId = this.contextService.getUserId()!;

    // 1. Validate quota & budget
    await this.validateQuota(organizationId);

    // 2. Check cache
    const cacheKey = this.generateCacheKey(dto);
    const cached = this.cache.get(cacheKey);
    if (cached && new Date() < cached.expiresAt) {
      this.logger.debug(`Cache hit for: ${dto.prompt.substring(0, 50)}`);
      return { ...cached.response, cacheHit: true };
    }

    // 3. Create AI request
    const request: AIGenerationRequest = {
      organizationId,
      userId,
      taskType: dto.taskType || AITaskType.GENERATE_CONTENT,
      model: dto.model,
      provider: dto.provider || AIProvider.OPENAI,
      prompt: dto.prompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      topP: dto.topP,
      metadata: dto.metadata,
    };

    // 4. Call provider
    let response: AIGenerationResponse;

    try {
      response = await this.generate(request);
    } catch (error) {
      this.logger.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }

    // 5. Cache response
    this.cacheResponse(cacheKey, response);

    // 6. Track usage & emit event
    await this.trackUsage(organizationId, userId, request, response);

    return response;
  }

  /**
   * Internal generate - delegates to provider
   */
  private async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const provider = this.getProvider(request.provider);

    if (!provider) {
      throw new ServiceUnavailableException(`Provider ${request.provider} not available`);
    }

    // Use circuit breaker to handle provider failures
    const circuitBreaker = this.circuitBreakerManager.getBreaker<AIGenerationResponse>({
      name: `ai-provider-${request.provider}`,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60_000,
    });

    try {
      return await circuitBreaker.execute(async () => {
        // Mock implementation - replace with actual provider calls
        const startTime = Date.now();

        // Simulated response
        const mockContent = `Generated content for: ${request.prompt.substring(0, 50)}...`;
        const MockTokens = 150;
        const outputTokens = 150;

        const cost = this.calculateCost(request.model, MockTokens, outputTokens);

        return {
          id: uuidv4(),
          content: mockContent,
          model: request.model,
          provider: request.provider,
          promptTokens: MockTokens,
          completionTokens: outputTokens,
          totalTokens: MockTokens + outputTokens,
          costUSD: cost,
          finishReason: 'stop',
          cacheHit: false,
          generationTime: Date.now() - startTime,
          createdAt: new Date(),
        };
      });
    } catch (error) {
      this.logger.error(`Generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Use prompt template
   */
  async useTemplate(dto: UseTemplateDto): Promise<AIGenerationResponse> {
    // Get template from database
    const template = await this.prisma.promptTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new BadRequestException('Template not found');
    }

    // Substitute variables
    let prompt = template.prompt;
    for (const [key, value] of Object.entries(dto.variables)) {
      prompt = prompt.replace(`{{${key}}}`, value);
    }

    // Generate with template
    return this.generateContent({
      prompt,
      model: dto.model || AIModel.GPT_4_TURBO,
      temperature: dto.temperature ?? 0.7,
    });
  }

  /**
   * Create prompt template
   */
  async createTemplate(dto: CreateTemplateDto): Promise<any> {
    const organizationId = this.contextService.getTenantId();

    return this.prisma.promptTemplate.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        prompt: dto.content,
        variables: dto.variables,
        organizationId: organizationId ?? null,
        createdBy: this.contextService.getUserId(),
        isPublic: false,
      },
    });
  }

  /**
   * Get templates
   */
  async getTemplates(category?: string): Promise<any[]> {
    const organizationId = this.contextService.getTenantId();

    return this.prisma.promptTemplate.findMany({
      where: {
        OR: [
          { organizationId: null },
          { organizationId: organizationId ?? undefined },
        ],
        ...(category ? { category } : {}),
      },
    });
  }

  /**
   * Batch generation (async)
   */
  async batchGenerate(requests: GenerateContentDto[]): Promise<{ jobId: string; estimatedTime: number }> {
    const jobId = uuidv4();

    // Queue batch job
    await this.aiQueue.add(
      'batch',
      {
        jobId,
        requests,
        organizationId: this.contextService.getTenantId(),
        userId: this.contextService.getUserId(),
      },
      { jobId },
    );

    return {
      jobId,
      estimatedTime: requests.length * 5, // Rough estimate
    };
  }

  /**
   * Get batch job result
   */
  async getBatchResult(jobId: string): Promise<any> {
    // TODO: Retrieve from job queue or database
    return null;
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(period: 'day' | 'week' | 'month' = 'month'): Promise<AIUsageMetrics> {
    const organizationId = this.contextService.getTenantId()!;

    // TODO: Aggregate from database
    return {
      organizationId,
      monthToDate: {
        totalRequests: 0,
        totalTokens: 0,
        totalCostUSD: 0,
      },
      today: {
        totalRequests: 0,
        totalTokens: 0,
        totalCostUSD: 0,
      },
      byModel: {},
      byTask: {},
      remaining: {
        monthlyBudget: 1000,
        dailyEstimate: 30,
        requestsLeft: 500,
      },
    };
  }

  /**
   * Validate organization quota
   */
  private async validateQuota(organizationId: string): Promise<void> {
    // TODO: Check monthly budget, daily limits, etc.
  }

  /**
   * Get provider instance
   */
  private getProvider(provider: AIProvider): any {
    const providers: Partial<Record<AIProvider, any>> = {
      [AIProvider.OPENAI]: this.openaiProvider,
      [AIProvider.CLAUDE]: this.claudeProvider,
      [AIProvider.LOCAL]: null, // TODO: Local provider
    };

    return providers[provider];
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(dto: GenerateContentDto): string {
    const data = JSON.stringify({
      prompt: dto.prompt,
      model: dto.model,
      temperature: dto.temperature ?? 0.7,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Cache response
   */
  private cacheResponse(key: string, response: AIGenerationResponse, ttlHours: number = 24): void {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    this.cache.set(key, { response, expiresAt });
  }

  /**
   * Track usage
   */
  private async trackUsage(
    organizationId: string,
    userId: string,
    request: AIGenerationRequest,
    response: AIGenerationResponse,
  ): Promise<void> {
    // Record in database
    await this.prisma.aIUsage.create({
      data: {
        organizationId,
        userId,
        model: request.model,
        provider: request.provider,
        inputTokens: response.promptTokens,
        outputTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        cost: response.costUSD,
        contentType: request.taskType,
        usedCache: response.cacheHit,
        responseTime: response.generationTime,
        success: true,
      },
    });

    // Emit analytics event
    await this.eventBus.publish(
      new AnalyticsEventEmittedEvent(
        organizationId,
        'ai.content_generated',
        organizationId,
        {
          taskType: request.taskType,
          provider: request.provider,
          model: request.model,
          tokensUsed: response.totalTokens,
          costUSD: response.costUSD,
          generationTime: response.generationTime,
        },
        this.contextService.getCorrelationId()!,
        userId,
      ),
    );
  }

  /**
   * Calculate cost
   */
  private calculateCost(model: AIModel, promptTokens: number, completionTokens: number): number {
    const pricing = this.pricing[model];

    if (!pricing) {
      return 0;
    }

    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Clear old cache entries
   */
  private clearExpiredCache(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
