/**
 * AI Module DTOs
 * Request/Response data transfer objects with validation
 */

import { IsString, IsEnum, IsOptional, IsNumber, IsArray, Min, Max, IsObject } from 'class-validator';
import { AIModel, AIProvider, AITaskType } from '../types/ai.types';

/**
 * Generate content request
 */
export class GenerateContentDto {
  @IsString()
  prompt: string;

  @IsEnum(AIModel)
  model: AIModel;

  @IsEnum(AIProvider)
  @IsOptional()
  provider?: AIProvider;

  @IsEnum(AITaskType)
  @IsOptional()
  taskType?: AITaskType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Use prompt template request
 */
export class UseTemplateDto {
  @IsString()
  templateId: string;

  @IsObject()
  variables: Record<string, string>;

  @IsEnum(AIModel)
  @IsOptional()
  model?: AIModel;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;
}

/**
 * Batch generation request
 */
export class BatchGenerateDto {
  @IsArray()
  requests: GenerateContentDto[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  concurrency?: number; // How many to process in parallel
}

/**
 * Create template request
 */
export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4000)
  maxTokens?: number;
}

/**
 * Get usage metrics query
 */
export class GetUsageMetricsDto {
  @IsString()
  @IsOptional()
  period?: 'day' | 'week' | 'month'; // Default: month
}
