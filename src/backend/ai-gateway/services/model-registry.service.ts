/**
 * Model Registry Service
 * Single source of truth for all AI models: capabilities, costs, status.
 * Seeds defaults on first boot. Hot-reloads from DB on demand.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  RegisteredModel,
  GatewayProvider,
  GatewayTask,
} from '../types/gateway.types';

// ─── Default model catalogue ──────────────────────────────────────────────────

const DEFAULT_MODELS: Omit<RegisteredModel, 'id'>[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────────
  {
    provider: GatewayProvider.OPENAI,
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Most capable OpenAI model — multimodal, 128k context.',
    isEnabled: true,
    costPerInputToken: 0.000005,   // $5 / 1M tokens
    costPerOutputToken: 0.000015,  // $15 / 1M tokens
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ['text', 'code', 'vision', 'analysis', 'reasoning'],
    qualityScore: 0.97,
    speedScore: 0.75,
    rateLimitPerMinute: 60,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['content_studio', 'ad_engine', 'seo'],
  },
  {
    provider: GatewayProvider.OPENAI,
    modelId: 'gpt-4-turbo-preview',
    displayName: 'GPT-4 Turbo',
    description: 'High-capability, 128k context, cost-effective vs GPT-4o.',
    isEnabled: true,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00003,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ['text', 'code', 'analysis'],
    qualityScore: 0.93,
    speedScore: 0.70,
    rateLimitPerMinute: 60,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['video_script', 'ugc'],
  },
  {
    provider: GatewayProvider.OPENAI,
    modelId: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    description: 'Fast, cheap — ideal for social captions and short-form.',
    isEnabled: true,
    costPerInputToken: 0.0000005,
    costPerOutputToken: 0.0000015,
    contextWindow: 16385,
    maxOutputTokens: 4096,
    capabilities: ['text', 'summarization', 'translation'],
    qualityScore: 0.72,
    speedScore: 0.97,
    rateLimitPerMinute: 200,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['social', 'email', 'chat'],
  },
  {
    provider: GatewayProvider.OPENAI,
    modelId: 'dall-e-3',
    displayName: 'DALL-E 3',
    description: 'State-of-the-art image generation from OpenAI.',
    isEnabled: true,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextWindow: 4096,
    maxOutputTokens: 0,
    capabilities: ['image_generation'],
    qualityScore: 0.95,
    speedScore: 0.50,
    rateLimitPerMinute: 15,
    supportsStreaming: false,
    supportsImages: true,
    assignedFeatures: ['image_studio', 'ad_creatives'],
  },
  // ── Anthropic ──────────────────────────────────────────────────────────
  {
    provider: GatewayProvider.CLAUDE,
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    description: 'Anthropic\'s most powerful model — deep reasoning, 200k context.',
    isEnabled: true,
    costPerInputToken: 0.000015,
    costPerOutputToken: 0.000075,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: ['text', 'code', 'analysis', 'reasoning', 'long_document'],
    qualityScore: 0.98,
    speedScore: 0.55,
    rateLimitPerMinute: 40,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['ai_ceo', 'business_insights'],
  },
  {
    provider: GatewayProvider.CLAUDE,
    modelId: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    description: 'Best balance of intelligence and speed — ideal for most tasks.',
    isEnabled: true,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: ['text', 'code', 'analysis', 'summarization', 'translation'],
    qualityScore: 0.90,
    speedScore: 0.82,
    rateLimitPerMinute: 100,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['content_studio', 'video_script', 'ugc'],
  },
  {
    provider: GatewayProvider.CLAUDE,
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    description: 'Fastest and cheapest Claude — great for high-volume short tasks.',
    isEnabled: true,
    costPerInputToken: 0.00000025,
    costPerOutputToken: 0.00000125,
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ['text', 'summarization', 'translation', 'moderation'],
    qualityScore: 0.75,
    speedScore: 0.98,
    rateLimitPerMinute: 400,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: ['social', 'email', 'moderation'],
  },
  // ── Google ─────────────────────────────────────────────────────────────
  {
    provider: GatewayProvider.GEMINI,
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Google\'s flagship — 1M context window, multimodal.',
    isEnabled: false,   // disabled until API key is configured
    costPerInputToken: 0.00000350,
    costPerOutputToken: 0.00001050,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ['text', 'code', 'vision', 'analysis', 'long_document'],
    qualityScore: 0.92,
    speedScore: 0.65,
    rateLimitPerMinute: 60,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: [],
  },
  {
    provider: GatewayProvider.GEMINI,
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Google\'s fast, cost-effective model — 1M context.',
    isEnabled: false,
    costPerInputToken: 0.00000035,
    costPerOutputToken: 0.00000105,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ['text', 'summarization', 'translation'],
    qualityScore: 0.78,
    speedScore: 0.92,
    rateLimitPerMinute: 200,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: [],
  },
  // ── Local ──────────────────────────────────────────────────────────────
  {
    provider: GatewayProvider.LOCAL,
    modelId: 'ollama:llama2',
    displayName: 'Llama 2 (Local)',
    description: 'Free self-hosted model via Ollama. No API cost.',
    isEnabled: false,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextWindow: 4096,
    maxOutputTokens: 2048,
    capabilities: ['text', 'code'],
    qualityScore: 0.60,
    speedScore: 0.45,
    rateLimitPerMinute: 10,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: [],
  },
  {
    provider: GatewayProvider.LOCAL,
    modelId: 'ollama:mistral',
    displayName: 'Mistral 7B (Local)',
    description: 'Free Mistral model via Ollama — fast and efficient.',
    isEnabled: false,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextWindow: 8192,
    maxOutputTokens: 4096,
    capabilities: ['text', 'code', 'summarization'],
    qualityScore: 0.65,
    speedScore: 0.55,
    rateLimitPerMinute: 10,
    supportsStreaming: true,
    supportsImages: false,
    assignedFeatures: [],
  },
];

// ─── Default feature assignments ─────────────────────────────────────────────

const DEFAULT_FEATURE_ASSIGNMENTS: Array<{
  feature: string;
  featureLabel: string;
  primaryModelId: string;  // will be resolved to DB id after seed
  fallbackModelId?: string;
  strategy: string;
}> = [
  { feature: 'content_studio',    featureLabel: 'AI Content Studio',     primaryModelId: 'gpt-4o',           fallbackModelId: 'claude-sonnet-4-6',     strategy: 'best_quality' },
  { feature: 'social',            featureLabel: 'Social Captions',       primaryModelId: 'claude-haiku-4-5-20251001', fallbackModelId: 'gpt-3.5-turbo', strategy: 'cheapest' },
  { feature: 'ad_engine',         featureLabel: 'AI Ads Engine',         primaryModelId: 'gpt-4o',           fallbackModelId: 'claude-sonnet-4-6',     strategy: 'best_quality' },
  { feature: 'video_script',      featureLabel: 'Video Script Generator', primaryModelId: 'claude-sonnet-4-6', fallbackModelId: 'gpt-4-turbo-preview', strategy: 'balanced' },
  { feature: 'ugc',               featureLabel: 'UGC Creator',            primaryModelId: 'claude-sonnet-4-6', fallbackModelId: 'gpt-3.5-turbo',       strategy: 'balanced' },
  { feature: 'email',             featureLabel: 'Email Copywriting',      primaryModelId: 'gpt-3.5-turbo',    fallbackModelId: 'claude-haiku-4-5-20251001', strategy: 'cheapest' },
  { feature: 'seo',               featureLabel: 'SEO Optimisation',       primaryModelId: 'gpt-4o',           fallbackModelId: 'claude-sonnet-4-6',     strategy: 'best_quality' },
  { feature: 'image_studio',      featureLabel: 'AI Image Studio',        primaryModelId: 'dall-e-3',                                                    strategy: 'cheapest' },
  { feature: 'ai_ceo',            featureLabel: 'AI CEO Decisions',       primaryModelId: 'claude-opus-4-6', fallbackModelId: 'gpt-4o',                 strategy: 'best_quality' },
  { feature: 'business_insights', featureLabel: 'Business Intelligence',  primaryModelId: 'claude-opus-4-6', fallbackModelId: 'gpt-4o',                 strategy: 'best_quality' },
  { feature: 'chat',              featureLabel: 'Chat Completions',       primaryModelId: 'gpt-3.5-turbo',   fallbackModelId: 'claude-haiku-4-5-20251001', strategy: 'fastest' },
  { feature: 'summarization',     featureLabel: 'Content Summarisation',  primaryModelId: 'claude-haiku-4-5-20251001', fallbackModelId: 'gpt-3.5-turbo', strategy: 'cheapest' },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);
  /** In-memory cache — refreshed every 5 minutes or on mutation */
  private modelCache: Map<string, RegisteredModel> = new Map();
  private lastRefreshed = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultModels();
    await this.refreshCache();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  async getAllModels(includeDisabled = true): Promise<RegisteredModel[]> {
    await this.ensureCacheValid();
    const all = Array.from(this.modelCache.values());
    return includeDisabled ? all : all.filter(m => m.isEnabled);
  }

  async getModelById(id: string): Promise<RegisteredModel | null> {
    await this.ensureCacheValid();
    return this.modelCache.get(id) ?? null;
  }

  async getModelByModelId(modelId: string): Promise<RegisteredModel | null> {
    await this.ensureCacheValid();
    return Array.from(this.modelCache.values()).find(m => m.modelId === modelId) ?? null;
  }

  async getEnabledModelsForCapability(capability: string): Promise<RegisteredModel[]> {
    await this.ensureCacheValid();
    return Array.from(this.modelCache.values()).filter(
      m => m.isEnabled && m.capabilities.includes(capability),
    );
  }

  async getEnabledModelsForTask(task: GatewayTask): Promise<RegisteredModel[]> {
    const capability = this.taskToCapability(task);
    return this.getEnabledModelsForCapability(capability);
  }

  async enableModel(id: string): Promise<RegisteredModel> {
    const model = await this.prisma.aIGatewayModel.update({
      where: { id },
      data: { isEnabled: true },
    });
    await this.refreshCache();
    this.logger.log(`Model enabled: ${model.displayName}`);
    return this.toRegisteredModel(model);
  }

  async disableModel(id: string): Promise<RegisteredModel> {
    const model = await this.prisma.aIGatewayModel.update({
      where: { id },
      data: { isEnabled: false },
    });
    await this.refreshCache();
    this.logger.warn(`Model disabled: ${model.displayName}`);
    return this.toRegisteredModel(model);
  }

  async updateModel(id: string, updates: Partial<RegisteredModel>): Promise<RegisteredModel> {
    const updateData: Record<string, unknown> = {};
    if (updates.isEnabled !== undefined)          updateData['isEnabled']           = updates.isEnabled;
    if (updates.costPerInputToken !== undefined)  updateData['costPerInputToken']   = updates.costPerInputToken;
    if (updates.costPerOutputToken !== undefined) updateData['costPerOutputToken']  = updates.costPerOutputToken;
    if (updates.qualityScore !== undefined)       updateData['qualityScore']        = updates.qualityScore;
    if (updates.speedScore !== undefined)         updateData['speedScore']          = updates.speedScore;
    if (updates.rateLimitPerMinute !== undefined) updateData['rateLimitPerMinute']  = updates.rateLimitPerMinute;
    if (updates.assignedFeatures !== undefined)   updateData['assignedFeatures']    = updates.assignedFeatures;
    if (updates.description !== undefined)        updateData['description']         = updates.description;

    const model = await this.prisma.aIGatewayModel.update({
      where: { id },
      data: updateData,
    });
    await this.refreshCache();
    return this.toRegisteredModel(model);
  }

  async getFeatureAssignments(): Promise<any[]> {
    return this.prisma.aIFeatureModelAssignment.findMany({
      include: {
        primaryModel: { select: { id: true, displayName: true, provider: true } },
        fallbackModel: { select: { id: true, displayName: true, provider: true } },
      },
      orderBy: { feature: 'asc' },
    });
  }

  async upsertFeatureAssignment(data: {
    feature: string;
    primaryModelId: string;
    fallbackModelId?: string;
    strategy?: string;
    maxCostPerRequest?: number;
    maxLatencyMs?: number;
    isActive?: boolean;
  }): Promise<any> {
    const result = await this.prisma.aIFeatureModelAssignment.upsert({
      where: { feature: data.feature },
      update: {
        primaryModelId:   data.primaryModelId,
        fallbackModelId:  data.fallbackModelId ?? null,
        strategy:         data.strategy ?? 'balanced',
        maxCostPerRequest: data.maxCostPerRequest ?? null,
        maxLatencyMs:     data.maxLatencyMs ?? null,
        isActive:         data.isActive ?? true,
      },
      create: {
        feature:          data.feature,
        featureLabel:     data.feature,
        primaryModelId:   data.primaryModelId,
        fallbackModelId:  data.fallbackModelId ?? null,
        strategy:         data.strategy ?? 'balanced',
        maxCostPerRequest: data.maxCostPerRequest ?? null,
        maxLatencyMs:     data.maxLatencyMs ?? null,
        isActive:         data.isActive ?? true,
      },
    });
    return result;
  }

  async getFeatureAssignment(feature: string): Promise<any | null> {
    return this.prisma.aIFeatureModelAssignment.findUnique({
      where: { feature },
      include: {
        primaryModel: true,
        fallbackModel: true,
      },
    });
  }

  // ── Seeding ────────────────────────────────────────────────────────────

  private async seedDefaultModels(): Promise<void> {
    const existing = await this.prisma.aIGatewayModel.count();
    if (existing > 0) return;

    this.logger.log('Seeding default AI model registry…');

    for (const model of DEFAULT_MODELS) {
      await this.prisma.aIGatewayModel.upsert({
        where: { provider_modelId: { provider: model.provider, modelId: model.modelId } },
        update: {},
        create: {
          provider:            model.provider,
          modelId:             model.modelId,
          displayName:         model.displayName,
          description:         model.description ?? '',
          isEnabled:           model.isEnabled,
          costPerInputToken:   model.costPerInputToken,
          costPerOutputToken:  model.costPerOutputToken,
          contextWindow:       model.contextWindow,
          maxOutputTokens:     model.maxOutputTokens,
          capabilities:        model.capabilities,
          qualityScore:        model.qualityScore,
          speedScore:          model.speedScore,
          rateLimitPerMinute:  model.rateLimitPerMinute,
          supportsStreaming:   model.supportsStreaming,
          supportsImages:      model.supportsImages,
          assignedFeatures:    model.assignedFeatures,
        },
      });
    }

    // Seed feature assignments after models exist
    for (const fa of DEFAULT_FEATURE_ASSIGNMENTS) {
      const primary  = await this.prisma.aIGatewayModel.findFirst({ where: { modelId: fa.primaryModelId } });
      const fallback = fa.fallbackModelId
        ? await this.prisma.aIGatewayModel.findFirst({ where: { modelId: fa.fallbackModelId } })
        : null;

      if (!primary) continue;

      await this.prisma.aIFeatureModelAssignment.upsert({
        where:  { feature: fa.feature },
        update: {},
        create: {
          feature:         fa.feature,
          featureLabel:    fa.featureLabel,
          primaryModelId:  primary.id,
          fallbackModelId: fallback?.id ?? null,
          strategy:        fa.strategy,
          isActive:        true,
        },
      });
    }

    this.logger.log('Model registry seeded ✓');
  }

  // ── Cache helpers ──────────────────────────────────────────────────────

  private async ensureCacheValid(): Promise<void> {
    if (Date.now() - this.lastRefreshed > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }
  }

  async refreshCache(): Promise<void> {
    const models = await this.prisma.aIGatewayModel.findMany();
    this.modelCache.clear();
    for (const m of models) {
      this.modelCache.set(m.id, this.toRegisteredModel(m));
    }
    this.lastRefreshed = Date.now();
  }

  private toRegisteredModel(raw: any): RegisteredModel {
    return {
      id:                  raw.id,
      provider:            raw.provider as GatewayProvider,
      modelId:             raw.modelId,
      apiIdentifier:       raw.modelId, // alias used in provider dispatch
      displayName:         raw.displayName,
      description:         raw.description ?? '',
      isEnabled:           raw.isEnabled,
      costPerInputToken:   raw.costPerInputToken,
      costPerOutputToken:  raw.costPerOutputToken,
      contextWindow:       raw.contextWindow ?? 4096,
      maxOutputTokens:     raw.maxOutputTokens ?? 1024,
      capabilities:        raw.capabilities ?? [],
      qualityScore:        raw.qualityScore ?? 0.5,
      speedScore:          raw.speedScore ?? 0.5,
      rateLimitPerMinute:  raw.rateLimitPerMinute ?? 60,
      supportsStreaming:   raw.supportsStreaming ?? true,
      supportsImages:      raw.supportsImages ?? false,
      assignedFeatures:    raw.assignedFeatures ?? [],
    };
  }

  private taskToCapability(task: GatewayTask): string {
    const MAP: Partial<Record<GatewayTask, string>> = {
      [GatewayTask.IMAGE_GENERATION]: 'image_generation',
      [GatewayTask.CODE_GENERATION]:  'code',
      [GatewayTask.TRANSLATION]:      'translation',
      [GatewayTask.SUMMARIZATION]:    'summarization',
    };
    return MAP[task] ?? 'text';
  }
}
