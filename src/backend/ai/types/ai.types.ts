/**
 * AI Provider Types & Interfaces
 * Defines core types for AI abstraction layer
 */

export enum AIProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  LOCAL = 'LOCAL',
  GEMINI = 'GEMINI',
}

export enum AIModel {
  // OpenAI
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5 = 'gpt-3.5',

  // Claude
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',

  // Gemini
  GEMINI_PRO = 'gemini-1.5-pro',
  GEMINI_PRO_MINI = 'gemini-1.5-flash',

  // Local
  OLLAMA_LLAMA2 = 'ollama:llama2',
  OLLAMA_MISTRAL = 'ollama:mistral',
}

export enum AICapability {
  TEXT_GENERATION = 'TEXT_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  VIDEO_SCRIPT = 'VIDEO_SCRIPT',
  AD_COPY = 'AD_COPY',
  SUMMARIZATION = 'SUMMARIZATION',
  TRANSLATION = 'TRANSLATION',
  CODE_GENERATION = 'CODE_GENERATION',
}

export interface AIModelConfig {
  model: AIModel;
  provider: AIProvider;
  maxTokens: number;
  costPer1kTokens: number; // Input cost
  costPer1kTokensOutput?: number; // Output cost (if different)
  capabilities: AICapability[];
  isAvailable: boolean;
  rateLimit: number; // requests per minute
}

export interface AIRequest {
  prompt: string;
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  metadata?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  text: string;
  model: AIModel;
  provider: AIProvider;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  cached: boolean;
  generatedAt: Date;
}

export interface ImageGenerationRequest {
  prompt: string;
  model: AIModel;
  size?: string; // e.g., '1024x1024'
  quantity?: number;
  style?: string;
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResponse {
  id: string;
  urls: string[];
  revisions?: string[];
  model: AIModel;
  provider: AIProvider;
  cost: number;
  generatedAt: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description: string;
  suggestedModel: AIModel;
  defaultTemperature: number;
  exampleOutput?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageStats {
  userId: string;
  provider: AIProvider;
  model: AIModel;
  requestCount: number;
  tokensUsed: number;
  totalCost: number;
  successRate: number;
  averageResponseTime: number; // in ms
  lastUsedAt: Date;
}

export interface AIFinancialsData {
  requestId: string;
  userId: string;
  model: AIModel;
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  costPerInput: number;
  costPerOutput: number;
  totalCost: number;
  usedCache: boolean;
  timestamp: Date;
}

export interface RoutingStrategy {
  type: 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom';
  preferences?: {
    maxCostPerRequest?: number;
    maxLatency?: number; // in ms
    preferredProviders?: AIProvider[];
    requiresAccuracy?: boolean;
  };
}

export interface ModelMetrics {
  model: AIModel;
  capabilities: AICapability[];
  accuracy: number; // 0-100
  speed: number; // tokens per second
  cost: number; // per 1k tokens
  availability: number; // 0-100
  rateLimitPerMinute: number;
}

export interface CacheEntry {
  id: string;
  hash: string; // Hash of prompt + parameters
  prompt: string;
  model: AIModel;
  provider: AIProvider;
  response: AIResponse;
  expiresAt: Date;
  hits: number;
  size: number; // in bytes
  createdAt: Date;
}

export interface AIProvider {
  name: string;
  isAvailable: boolean;
  generateText(request: AIRequest): Promise<AIResponse>;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  getTokenCount(text: string): Promise<number>;
  getAvailableModels(): AIModel[];
  validateCredentials(): Promise<boolean>;
}
