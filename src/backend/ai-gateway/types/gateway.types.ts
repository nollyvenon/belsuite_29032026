/**
 * AI Gateway — Type Definitions
 * Central type system for all orchestration primitives
 */

// ─── Provider & Model identifiers ────────────────────────────────────────────

export enum GatewayProvider {
  OPENAI  = 'OPENAI',
  CLAUDE  = 'CLAUDE',
  GEMINI  = 'GEMINI',
  LOCAL   = 'LOCAL',
}

export enum GatewayModel {
  // OpenAI
  GPT_4O           = 'gpt-4o',
  GPT_4_TURBO      = 'gpt-4-turbo-preview',
  GPT_4            = 'gpt-4',
  GPT_3_5_TURBO    = 'gpt-3.5-turbo',
  DALL_E_3         = 'dall-e-3',
  // Anthropic
  CLAUDE_OPUS_46   = 'claude-opus-4-6',
  CLAUDE_SONNET_46 = 'claude-sonnet-4-6',
  CLAUDE_HAIKU_45  = 'claude-haiku-4-5-20251001',
  // Google
  GEMINI_PRO_15    = 'gemini-1.5-pro',
  GEMINI_FLASH_15  = 'gemini-1.5-flash',
  // Local
  OLLAMA_LLAMA2    = 'ollama:llama2',
  OLLAMA_MISTRAL   = 'ollama:mistral',
}

// ─── Task classification ──────────────────────────────────────────────────────

export enum GatewayTask {
  // Long-form content
  CONTENT_LONG_FORM   = 'content_long_form',   // Blog posts, articles
  AD_COPY             = 'ad_copy',             // Ad copy & headlines
  EMAIL_DRAFT         = 'email_draft',         // Email copywriting
  VIDEO_SCRIPT        = 'video_script',        // Video & UGC scripts
  SOCIAL_POST         = 'social_post',         // Social captions / short-form
  SEO_ANALYSIS        = 'seo_analysis',        // SEO content + keyword analysis
  // Reasoning & analysis
  SUMMARIZATION       = 'summarization',
  TRANSLATION         = 'translation',
  CLASSIFICATION      = 'classification',
  CODE_GENERATION     = 'code_generation',
  BUSINESS_INSIGHTS   = 'business_insights',   // AI CEO decisions
  // Media
  IMAGE_GENERATION    = 'image_generation',
  IMAGE_EDIT          = 'image_edit',
  // Utility
  CHAT                = 'chat',                // Interactive chat
  MODERATION          = 'moderation',
  EMBEDDING           = 'embedding',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  CUSTOM              = 'custom',              // Caller-defined routing
}

// ─── Routing ─────────────────────────────────────────────────────────────────

export type RoutingStrategy =
  | 'cheapest'
  | 'fastest'
  | 'best_quality'
  | 'balanced'
  | 'custom';

export interface RoutingPreferences {
  strategy: RoutingStrategy;
  maxCostUsdPerRequest?: number;
  maxLatencyMs?: number;
  preferredProviders?: GatewayProvider[];
  excludedModels?: string[];         // model DB ids to skip
  requireCapabilities?: string[];
}

// ─── Gateway request / response ──────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GatewayRequest {
  organizationId: string;
  userId?: string;
  task: GatewayTask;
  feature: string;            // e.g. "ad_engine", "content_studio"
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  routing?: RoutingPreferences;
  useCache?: boolean;         // default true
  cacheTtlSeconds?: number;   // override default 24h TTL
  conversationHistory?: ConversationMessage[];
  metadata?: Record<string, unknown>;
}

export interface GatewayImageRequest {
  organizationId: string;
  userId?: string;
  feature: string;
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  quantity?: number;
  style?: 'vivid' | 'natural';
}

export interface GatewayResponse {
  requestId: string;
  text: string;
  model: string;
  provider: GatewayProvider;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  costUsd: number;
  latencyMs: number;
  cacheHit: boolean;
  failoverUsed: boolean;
  failoverChain?: string[];   // models attempted before success
  metadata?: Record<string, unknown>;
}

export interface GatewayImageResponse {
  requestId: string;
  urls: string[];
  model: string;
  provider: GatewayProvider;
  costUsd: number;
  latencyMs: number;
}

// ─── Model registry ──────────────────────────────────────────────────────────

export interface RegisteredModel {
  id: string;
  provider: GatewayProvider;
  /** Exact API identifier (e.g. "gpt-4o", "claude-sonnet-4-6") — same as DB `modelId` column */
  modelId: string;
  /** Alias for modelId — used in provider call dispatch */
  apiIdentifier?: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  costPerInputToken: number;     // USD per token
  costPerOutputToken: number;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: string[];
  qualityScore: number;          // 0–1
  speedScore: number;            // 0–1 (higher = faster)
  rateLimitPerMinute: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
  assignedFeatures: string[];
}

// ─── Health & circuit breaker ─────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ProviderHealth {
  modelId: string;
  modelDisplayName: string;
  provider: GatewayProvider;
  isHealthy: boolean;
  circuitState: CircuitState;
  consecutiveFailures: number;
  successRatePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalRequests: number;
  totalFailures: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  lastError?: string;
  nextRetryAt?: Date;
}

// ─── Usage / budget ───────────────────────────────────────────────────────────

export interface BudgetStatus {
  organizationId: string;
  dailySpendUsd: number;
  monthlySpendUsd: number;
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  dailyPct: number;             // 0–100
  monthlyPct: number;
  isBlocked: boolean;
  alertTriggered: boolean;
}

export interface UsageReport {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  successRate: number;
  byModel: UsageByDimension;
  byProvider: UsageByDimension;
  byFeature: UsageByDimension;
  byTask: UsageByDimension;
  dailyBreakdown: DailyUsage[];
}

export type UsageByDimension = Record<string, {
  requests: number;
  tokens: number;
  costUsd: number;
  cacheHits: number;
}>;

export interface DailyUsage {
  date: string;              // YYYY-MM-DD
  requests: number;
  tokens: number;
  costUsd: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CacheStats {
  backend: 'redis' | 'memory';
  entries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  estimatedSavedUsd: number;
  totalSizeBytes: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface GatewayAdminSummary {
  totalModels: number;
  enabledModels: number;
  healthyModels: number;
  openCircuits: number;
  todayRequests: number;
  todayCostUsd: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  topModel: string;
  topFeature: string;
}

// ─── Feature assignment ───────────────────────────────────────────────────────

export interface FeatureAssignment {
  id: string;
  feature: string;
  featureLabel: string;
  primaryModelId: string;
  primaryModelName: string;
  fallbackModelId?: string;
  fallbackModelName?: string;
  strategy: RoutingStrategy;
  maxCostPerRequest?: number;
  maxLatencyMs?: number;
  isActive: boolean;
}

// ─── Batch ────────────────────────────────────────────────────────────────────

export interface BatchGatewayRequest {
  requests: GatewayRequest[];
  maxConcurrency?: number;    // default 5
  failFast?: boolean;         // abort batch on first failure
}

export interface BatchGatewayResponse {
  results: Array<GatewayResponse | { error: string; requestIndex: number }>;
  totalCostUsd: number;
  successCount: number;
  failureCount: number;
  totalLatencyMs: number;
}
