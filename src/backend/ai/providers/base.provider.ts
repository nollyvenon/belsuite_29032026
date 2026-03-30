/**
 * Base AI Provider Interface
 * Abstract base for all provider implementations
 */

import { AIRequest, AIResponse, ImageGenerationRequest, ImageGenerationResponse, AIModel, AICapability } from '../types/ai.types';

export abstract class BaseAIProvider {
  abstract name: string;
  abstract isAvailable: boolean;

  abstract generateText(request: AIRequest): Promise<AIResponse>;
  abstract generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  abstract getTokenCount(text: string): Promise<number>;
  abstract getAvailableModels(): AIModel[];
  abstract validateCredentials(): Promise<boolean>;

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected calculateCost(
    inputTokens: number,
    outputTokens: number,
    costPerInput: number,
    costPerOutput?: number,
  ): number {
    const inputCost = (inputTokens / 1000) * costPerInput;
    const outputCost = outputTokens && costPerOutput 
      ? (outputTokens / 1000) * costPerOutput 
      : 0;
    return inputCost + outputCost;
  }
}
