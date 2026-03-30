/**
 * AI Service
 * Main orchestration layer with smart routing, caching, and cost tracking
 */

import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { LocalModelProvider } from './providers/local.provider';
import { AIUsageLimitService } from './services/ai-usage-limit.service';
import {
  AIRequest,
  AIResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProvider as AIProviderEnum,
  AIModel,
  AICapability,
  RoutingStrategy,
  CacheEntry,
  AIFinancialsData,
  PromptTemplate,
} from './types/ai.types';
import * as crypto from 'crypto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private providers: Map<AIProviderEnum, any>;
  private modelMetrics: Map<AIModel, any> = new Map();

  // Model configuration with capabilities
  private modelCapabilities: Map<AIModel, AICapability[]> = new Map([
    [
      AIModel.GPT_4_TURBO,
      [
        AICapability.TEXT_GENERATION,
        AICapability.CODE_GENERATION,
        AICapability.SUMMARIZATION,
      ],
    ],
    [
      AIModel.CLAUDE_3_OPUS,
      [
        AICapability.TEXT_GENERATION,
        AICapability.CODE_GENERATION,
        AICapability.SUMMARIZATION,
        AICapability.TRANSLATION,
      ],
    ],
    [
      AIModel.GPT_3_5_TURBO,
      [AICapability.TEXT_GENERATION, AICapability.SUMMARIZATION],
    ],
    [
      AIModel.OLLAMA_LLAMA2,
      [AICapability.TEXT_GENERATION, AICapability.CODE_GENERATION],
    ],
  ]);

  private modelCosts: Map<AIModel, { input: number; output: number }> = new Map([
    [AIModel.GPT_4_TURBO, { input: 0.01, output: 0.03 }],
    [AIModel.GPT_4, { input: 0.03, output: 0.06 }],
    [AIModel.GPT_3_5_TURBO, { input: 0.0015, output: 0.002 }],
    [AIModel.CLAUDE_3_OPUS, { input: 0.015, output: 0.075 }],
    [AIModel.CLAUDE_3_SONNET, { input: 0.003, output: 0.015 }],
    [AIModel.CLAUDE_3_HAIKU, { input: 0.00025, output: 0.00125 }],
    [AIModel.OLLAMA_LLAMA2, { input: 0, output: 0 }],
    [AIModel.OLLAMA_MISTRAL, { input: 0, output: 0 }],
  ]);

  // In-memory cache (in production, use Redis)
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    private openaiProvider: OpenAIProvider,
    private claudeProvider: ClaudeProvider,
    private localProvider: LocalModelProvider,
    private usageLimitService: AIUsageLimitService,
  ) {
    this.providers = new Map([
      [AIProviderEnum.OPENAI, this.openaiProvider],
      [AIProviderEnum.CLAUDE, this.claudeProvider],
      [AIProviderEnum.LOCAL, this.localProvider],
    ]);
  }

  /**
   * Generate text with smart provider routing
   */
  async generateText(
    request: AIRequest,
    organizationId: string,
    userId: string,
    strategy: RoutingStrategy = { type: 'cheapest' },
    useCache = true,
  ): Promise<AIResponse> {
    try {
      // Estimate tokens for validation (4 chars = 1 token)
      const estimatedTokens = Math.ceil(request.prompt.length / 4) * 2; // 2x for safety

      // Check usage limits before generating
      await this.usageLimitService.validateUsageLimit(organizationId, userId, estimatedTokens);

      // Check cache first
      if (useCache) {
        const cached = this.getFromCache(request.prompt, request.model);
        if (cached) {
          this.logger.log(`Cache hit for prompt: ${request.prompt.substring(0, 30)}...`);
          cached.hits++;
          return { ...cached.response, cached: true };
        }
      }

      // Route to appropriate provider
      const selectedModel = request.model || (await this.selectBestModel(strategy, AICapability.TEXT_GENERATION));

      const provider = this.getProviderForModel(selectedModel);
      if (!provider) {
        throw new ServiceUnavailableException(
          `No provider available for model: ${selectedModel}`,
        );
      }

      // Generate response
      const response = await provider.generateText({
        ...request,
        model: selectedModel,
      });

      // Track usage
      await this.trackUsage(organizationId, userId, selectedModel, response);

      // Cache result
      if (useCache) {
        this.cacheResult(request.prompt, response);
      }

      this.logger.log(
        `Text generated via ${response.provider}: ${selectedModel} (Cost: $${response.cost.toFixed(4)})`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Text generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate image with smart provider routing
   */
  async generateImage(
    request: ImageGenerationRequest,
    organizationId: string,
    userId: string,
    strategy: RoutingStrategy = { type: 'cheapest' },
  ): Promise<ImageGenerationResponse> {
    try {
      // Estimate tokens for image generation (each image ~500 tokens)
      const estimatedTokens = (request.quantity || 1) * 500;

      // Check usage limits before generating
      await this.usageLimitService.validateUsageLimit(organizationId, userId, estimatedTokens);

      // Only OpenAI supports image generation for now
      const provider = this.providers.get(AIProviderEnum.OPENAI);
      if (!provider || !provider.isAvailable) {
        throw new ServiceUnavailableException(
          'Image generation provider not available',
        );
      }

      const response = await provider.generateImage(request);

      // Track usage
      await this.trackImageUsage(organizationId, userId, response);

      this.logger.log(
        `Image generated: ${request.prompt.substring(0, 30)}... (Cost: $${response.cost.toFixed(4)})`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Image generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Smart model selection based on strategy
   */
  private async selectBestModel(
    strategy: RoutingStrategy,
    capability: AICapability,
  ): Promise<AIModel> {
    const availableModels = Array.from(this.modelCapabilities.entries())
      .filter(([_, caps]) => caps.includes(capability))
      .map(([model, _]) => model);

    if (availableModels.length === 0) {
      throw new BadRequestException(
        `No models available for capability: ${capability}`,
      );
    }

    switch (strategy.type) {
      case 'cheapest':
        return this.selectCheapestModel(availableModels, strategy);

      case 'fastest':
        return this.selectFastestModel(availableModels, strategy);

      case 'best_quality':
        return this.selectBestQualityModel(availableModels, strategy);

      case 'balanced':
        // Balance cost, speed, and quality
        return availableModels[0]; // Default to first available

      case 'custom':
        return this.selectCustomModel(availableModels, strategy);

      default:
        return availableModels[0];
    }
  }

  private selectCheapestModel(
    models: AIModel[],
    strategy: RoutingStrategy,
  ): AIModel {
    let cheapest = models[0];
    let lowestCost = Infinity;

    for (const model of models) {
      const cost = this.modelCosts.get(model)?.input || Infinity;
      const isBelowMax =
        !strategy.preferences?.maxCostPerRequest ||
        cost <= strategy.preferences.maxCostPerRequest;

      if (isBelowMax && cost < lowestCost) {
        lowestCost = cost;
        cheapest = model;
      }
    }

    return cheapest;
  }

  private selectFastestModel(
    models: AIModel[],
    strategy: RoutingStrategy,
  ): AIModel {
    // GPT-3.5 is typically faster than GPT-4
    if (models.includes(AIModel.GPT_3_5_TURBO)) {
      return AIModel.GPT_3_5_TURBO;
    }
    if (models.includes(AIModel.CLAUDE_3_HAIKU)) {
      return AIModel.CLAUDE_3_HAIKU;
    }
    return models[0];
  }

  private selectBestQualityModel(
    models: AIModel[],
    strategy: RoutingStrategy,
  ): AIModel {
    // GPT-4 and Claude Opus have best quality
    if (models.includes(AIModel.GPT_4_TURBO)) {
      return AIModel.GPT_4_TURBO;
    }
    if (models.includes(AIModel.CLAUDE_3_OPUS)) {
      return AIModel.CLAUDE_3_OPUS;
    }
    return models[0];
  }

  private selectCustomModel(
    models: AIModel[],
    strategy: RoutingStrategy,
  ): AIModel {
    const prefs = strategy.preferences;
    if (!prefs) return models[0];

    // Filter by preferred providers
    if (prefs.preferredProviders && prefs.preferredProviders.length > 0) {
      const filtered = models.filter(m =>
        this.getProviderForModel(m).name
          .toLowerCase()
          .includes(prefs.preferredProviders![0].toLowerCase()),
      );
      if (filtered.length > 0) {
        return filtered[0];
      }
    }

    return models[0];
  }

  /**
   * Get provider instance for model
   */
  private getProviderForModel(model: AIModel): any {
    if (
      [
        AIModel.GPT_4_TURBO,
        AIModel.GPT_4,
        AIModel.GPT_3_5_TURBO,
        AIModel.GPT_3_5,
      ].includes(model)
    ) {
      return this.providers.get(AIProviderEnum.OPENAI);
    }
    if (
      [
        AIModel.CLAUDE_3_OPUS,
        AIModel.CLAUDE_3_SONNET,
        AIModel.CLAUDE_3_HAIKU,
      ].includes(model)
    ) {
      return this.providers.get(AIProviderEnum.CLAUDE);
    }
    if ([AIModel.OLLAMA_LLAMA2, AIModel.OLLAMA_MISTRAL].includes(model)) {
      return this.providers.get(AIProviderEnum.LOCAL);
    }
    return null;
  }

  /**
   * Cache result in memory (should use Redis in production)
   */
  private cacheResult(prompt: string, response: AIResponse): void {
    const hash = this.hashPrompt(prompt);
    const entry: CacheEntry = {
      id: this.hashPrompt(prompt),
      hash,
      prompt,
      model: response.model,
      provider: response.provider,
      response,
      expiresAt: new Date(Date.now() + this.CACHE_TTL),
      hits: 0,
      size: JSON.stringify(response).length,
      createdAt: new Date(),
    };

    this.cache.set(hash, entry);
  }

  /**
   * Get from cache
   */
  private getFromCache(prompt: string, model: AIModel): CacheEntry | null {
    const hash = this.hashPrompt(prompt);
    const entry = this.cache.get(hash);

    if (!entry) return null;
    if (entry.expiresAt < new Date()) {
      this.cache.delete(hash);
      return null;
    }
    if (entry.model !== model) return null;

    return entry;
  }

  /**
   * Hash prompt for cache key
   */
  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Track usage and costs
   */
  private async trackUsage(organizationId: string, userId: string, model: AIModel, response: AIResponse): Promise<void> {
    try {
      const costs = this.modelCosts.get(model);
      if (!costs) return;

      const financials: AIFinancialsData = {
        requestId: response.id,
        userId,
        model,
        provider: response.provider,
        inputTokens: response.tokens.prompt,
        outputTokens: response.tokens.completion,
        costPerInput: costs.input,
        costPerOutput: costs.output,
        totalCost: response.cost,
        usedCache: response.cached,
        timestamp: new Date(),
      };

      // Store in database
      await this.prisma.aiUsage.create({
        data: {
          organizationId,
          userId,
          model: model.toString(),
          provider: response.provider.toString(),
          inputTokens: response.tokens.prompt,
          outputTokens: response.tokens.completion,
          totalTokens: response.tokens.total,
          cost: response.cost,
          usedCache: response.cached,
          contentType: 'text_generation',
          success: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track usage: ${error.message}`);
    }
  }

  private async trackImageUsage(organizationId: string, userId: string, response: ImageGenerationResponse): Promise<void> {
    try {
      await this.prisma.aiUsage.create({
        data: {
          organizationId,
          userId,
          model: response.model.toString(),
          provider: response.provider.toString(),
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: (response.quantity || 1) * 500, // Estimate image generation tokens
          cost: response.cost,
          usedCache: false,
          contentType: 'image_generation',
          success: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track image usage: ${error.message}`);
    }
  }

  /**
   * Get user's AI usage stats
   */
  async getUserStats(userId: string) {
    try {
      const stats = await this.prisma.aiUsage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const summary = {
        totalRequests: stats.length,
        totalCost: stats.reduce((sum, s) => sum + s.cost, 0),
        totalTokens: stats.reduce((sum, s) => sum + s.totalTokens, 0),
        totalCached: stats.filter(s => s.usedCache).length,
        byModel: this.groupBy(stats, 'model'),
        byProvider: this.groupBy(stats, 'provider'),
        lastUsedAt: stats[0]?.createdAt,
      };

      return summary;
    } catch (error) {
      this.logger.error(`Failed to get user stats: ${error.message}`);
      return null;
    }
  }

  private groupBy(items: any[], key: string) {
    return items.reduce(
      (result, item) => {
        const group = item[key];
        if (!result[group]) {
          result[group] = { count: 0, cost: 0, tokens: 0 };
        }
        result[group].count++;
        result[group].cost += item.cost || 0;
        result[group].tokens += item.totalTokens || 0;
        return result;
      },
      {} as Record<string, any>,
    );
  }

  /**
   * Validate all providers
   */
  async validateProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.validateCredentials();
      } catch {
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalSize = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      totalHits += entry.hits;
    }

    return {
      entries: this.cache.size,
      totalSize: totalSize,
      totalHits: totalHits,
      avgSize: this.cache.size > 0 ? totalSize / this.cache.size : 0,
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    let cleared = 0;
    const now = new Date();

    for (const [hash, entry] of this.cache) {
      if (entry.expiresAt < now) {
        this.cache.delete(hash);
        cleared++;
      }
    }

    this.logger.log(`Cleared ${cleared} expired cache entries`);
    return cleared;
  }
}
