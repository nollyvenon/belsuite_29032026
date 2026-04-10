/**
 * AI Gateway — Data Transfer Objects
 */

import {
  IsString, IsEnum, IsOptional, IsBoolean, IsNumber,
  IsArray, IsObject, Min, Max, ValidateNested, IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GatewayTask, RoutingStrategy, GatewayProvider } from '../types/gateway.types';

// ─── Generate ─────────────────────────────────────────────────────────────────

export class RoutingPreferencesDto {
  @IsEnum(['cheapest', 'fastest', 'best_quality', 'balanced', 'custom'])
  @IsOptional()
  strategy?: RoutingStrategy;

  @IsNumber() @IsOptional() @IsPositive()
  maxCostUsdPerRequest?: number;

  @IsInt() @IsOptional() @IsPositive()
  maxLatencyMs?: number;

  @IsArray() @IsOptional()
  preferredProviders?: GatewayProvider[];

  @IsArray() @IsOptional()
  excludedModels?: string[];
}

export class GenerateTextDto {
  @IsEnum(GatewayTask)
  task: GatewayTask;

  @IsString()
  feature: string;

  @IsString()
  prompt: string;

  @IsString() @IsOptional()
  systemPrompt?: string;

  @IsInt() @IsOptional() @Min(1) @Max(128000)
  maxTokens?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(2)
  temperature?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(1)
  topP?: number;

  @IsArray() @IsOptional()
  stopSequences?: string[];

  @IsBoolean() @IsOptional()
  useCache?: boolean;

  @ValidateNested() @IsOptional()
  @Type(() => RoutingPreferencesDto)
  routing?: RoutingPreferencesDto;

  @IsObject() @IsOptional()
  metadata?: Record<string, unknown>;
}

export class GenerateImageDto {
  @IsString()
  feature: string;

  @IsString()
  prompt: string;

  @IsEnum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
  @IsOptional()
  size?: string;

  @IsEnum(['standard', 'hd']) @IsOptional()
  quality?: 'standard' | 'hd';

  @IsInt() @IsOptional() @Min(1) @Max(10)
  quantity?: number;

  @IsEnum(['vivid', 'natural']) @IsOptional()
  style?: 'vivid' | 'natural';
}

export class BatchGenerateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateTextDto)
  requests: GenerateTextDto[];

  @IsInt() @IsOptional() @Min(1) @Max(20)
  maxConcurrency?: number;

  @IsBoolean() @IsOptional()
  failFast?: boolean;
}

// ─── Admin: Models ────────────────────────────────────────────────────────────

export class UpdateModelDto {
  @IsBoolean() @IsOptional()
  isEnabled?: boolean;

  @IsNumber() @IsOptional() @IsPositive()
  costPerInputToken?: number;

  @IsNumber() @IsOptional() @IsPositive()
  costPerOutputToken?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(1)
  qualityScore?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(1)
  speedScore?: number;

  @IsInt() @IsOptional() @IsPositive()
  rateLimitPerMinute?: number;

  @IsArray() @IsOptional()
  assignedFeatures?: string[];

  @IsString() @IsOptional()
  description?: string;
}

export class RegisterModelDto {
  @IsString()
  provider: string;

  @IsString()
  modelId: string;

  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  capabilities?: string[];

  @IsArray()
  @IsOptional()
  assignedFeatures?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerInputToken?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerOutputToken?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  qualityScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  speedScore?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  contextWindow?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxOutputTokens?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  rateLimitPerMinute?: number;

  @IsBoolean()
  @IsOptional()
  supportsStreaming?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsImages?: boolean;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

// ─── Admin: Budget ────────────────────────────────────────────────────────────

export class UpsertBudgetDto {
  /**
   * Scope — supply exactly one (or neither for global default):
   *   organizationId  → org-specific override (highest priority)
   *   planTier        → applies to all orgs on that plan
   *   (neither)       → global default (lowest priority)
   */
  @IsString() @IsOptional()
  organizationId?: string | null;

  @IsEnum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  @IsOptional()
  planTier?: string | null;

  @IsNumber() @IsOptional() @IsPositive()
  dailyLimitUsd?: number | null;

  @IsNumber() @IsOptional() @IsPositive()
  monthlyLimitUsd?: number | null;

  @IsNumber() @IsOptional() @IsPositive()
  perRequestLimitUsd?: number | null;

  @IsNumber() @IsOptional() @Min(1) @Max(100)
  alertThresholdPct?: number;

  @IsBoolean() @IsOptional()
  blockOnExceed?: boolean;

  @IsString() @IsOptional()
  notifyEmail?: string | null;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

// ─── Admin: Feature assignments ───────────────────────────────────────────────

export class UpsertFeatureAssignmentDto {
  @IsString()
  feature: string;

  @IsString()
  primaryModelId: string;

  @IsString() @IsOptional()
  fallbackModelId?: string;

  @IsEnum(['cheapest', 'fastest', 'best_quality', 'balanced', 'custom'])
  @IsOptional()
  strategy?: RoutingStrategy;

  @IsNumber() @IsOptional() @IsPositive()
  maxCostPerRequest?: number;

  @IsInt() @IsOptional() @IsPositive()
  maxLatencyMs?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateControlProfileDto {
  @IsEnum(['CHEAP', 'BALANCED', 'PREMIUM'])
  @IsOptional()
  mode?: 'CHEAP' | 'BALANCED' | 'PREMIUM';

  @IsBoolean()
  @IsOptional()
  dynamicEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  costWeight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  qualityWeight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  speedWeight?: number;

  @IsArray()
  @IsOptional()
  cheapProviders?: GatewayProvider[];

  @IsArray()
  @IsOptional()
  premiumProviders?: GatewayProvider[];
}

export class SetFeatureToggleDto {
  @IsString()
  key: string;

  @IsBoolean()
  enabled: boolean;
}

export class UpdateUsageLimitsDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(256000)
  maxTokensPerRequest?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxBatchRequests?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxFailoverModels?: number;
}

export class SetFeatureModelLimitDto {
  @IsString()
  feature: string;

  @IsArray()
  modelIds: string[];
}

export class SetTenantUsageLimitDto extends UpdateUsageLimitsDto {
  @IsString()
  organizationId: string;
}

export class SetTenantFeatureModelLimitDto extends SetFeatureModelLimitDto {
  @IsString()
  organizationId: string;
}

export class SetContentTypeProviderModelDto {
  @IsEnum(['text', 'image', 'video', 'ugc', 'audio'])
  contentType: 'text' | 'image' | 'video' | 'ugc' | 'audio';

  @IsString()
  provider: string;

  @IsString()
  modelId: string;
}

export class SetModelCredentialDto {
  @IsString()
  modelId: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;
}

export class TestModelCredentialDto {
  @IsString()
  modelId: string;
}

export class SetTaskRouteDto {
  @IsString()
  task: string;

  @IsString()
  primaryModelId: string;

  @IsArray()
  @IsOptional()
  fallbackModelIds?: string[];

  @IsEnum(['cheapest', 'fastest', 'best_quality', 'balanced', 'custom'])
  @IsOptional()
  strategy?: RoutingStrategy;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxCostUsdPerRequest?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxLatencyMs?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpsertTaskCatalogDto {
  @IsString()
  taskKey: string;

  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export class RequestLogQueryDto {
  @IsString() @IsOptional()
  organizationId?: string;

  @IsString() @IsOptional()
  feature?: string;

  @IsString() @IsOptional()
  provider?: string;

  @IsBoolean() @IsOptional()
  cacheHit?: boolean;

  @IsBoolean() @IsOptional()
  success?: boolean;

  @IsString() @IsOptional()
  fromDate?: string;           // ISO date string

  @IsString() @IsOptional()
  toDate?: string;

  @IsInt() @IsOptional() @Min(1) @Max(500)
  limit?: number;

  @IsInt() @IsOptional() @Min(0)
  offset?: number;
}

export class UsageQueryDto {
  @IsString() @IsOptional()
  organizationId?: string;

  @IsEnum(['today', '7d', '30d', 'custom']) @IsOptional()
  period?: string;

  @IsString() @IsOptional()
  fromDate?: string;

  @IsString() @IsOptional()
  toDate?: string;
}
