/**
 * Claude Provider Implementation
 * Handles integration with Anthropic's Claude API
 */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BaseAIProvider } from './base.provider';
import {
  AIRequest,
  AIResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIModel,
  AIProvider as AIProviderEnum,
} from '../types/ai.types';

@Injectable()
export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude';
  isAvailable = true;
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  // Model configurations with costs (per 1k tokens)
  private modelConfigs: Partial<Record<AIModel, { inputCost: number; outputCost: number }>> = {
    [AIModel.CLAUDE_3_OPUS]: { inputCost: 0.015, outputCost: 0.075 },
    [AIModel.CLAUDE_3_SONNET]: { inputCost: 0.003, outputCost: 0.015 },
    [AIModel.CLAUDE_3_HAIKU]: { inputCost: 0.00025, outputCost: 0.00125 },
  };

  async generateText(request: AIRequest): Promise<AIResponse> {
    try {
      this.logger.log(`Generating text with Claude model: ${request.model}`);

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: request.model,
          max_tokens: request.maxTokens || 1000,
          messages: [{ role: 'user', content: request.prompt }],
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        },
      );

      const { content, usage } = response.data;
      const config =
        this.modelConfigs[request.model as AIModel] ??
        this.modelConfigs[AIModel.CLAUDE_3_SONNET]!;

      const cost = this.calculateCost(
        usage.input_tokens,
        usage.output_tokens,
        config.inputCost,
        config.outputCost,
      );

      return {
        id: this.generateId(),
        text: content[0].text,
        model: request.model as AIModel,
        provider: AIProviderEnum.CLAUDE,
        tokens: {
          prompt: usage.input_tokens,
          completion: usage.output_tokens,
          total: usage.input_tokens + usage.output_tokens,
        },
        cost,
        cached: false,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Claude text generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Claude doesn't natively support image generation
    // This would need to be delegated to another provider
    throw new Error('Claude does not support image generation. Use OpenAI or another provider.');
  }

  async getTokenCount(text: string): Promise<number> {
    try {
      // Using estimation: ~4 chars = 1 token for Claude as well
      return Math.ceil(text.length / 4);
    } catch (error) {
      this.logger.error(`Token count calculation failed: ${error.message}`);
      return Math.ceil(text.length / 4);
    }
  }

  getAvailableModels(): AIModel[] {
    return [AIModel.CLAUDE_3_OPUS, AIModel.CLAUDE_3_SONNET, AIModel.CLAUDE_3_HAIKU];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test with a simple request
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: AIModel.CLAUDE_3_HAIKU,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 5000,
        },
      );

      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch (error) {
      this.logger.warn(`Claude credentials validation failed: ${error.message}`);
      this.isAvailable = false;
      return false;
    }
  }
}
