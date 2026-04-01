/**
 * OpenAI Provider Implementation
 * Handles integration with OpenAI's API (GPT-4, GPT-3.5)
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
  AICapability,
} from '../types/ai.types';

@Injectable()
export class OpenAIProvider extends BaseAIProvider {
  name = 'OpenAI';
  isAvailable = true;
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly baseUrl = 'https://api.openai.com/v1';

  // Model configurations with costs (per 1k tokens)
  private modelConfigs: Partial<Record<AIModel, { inputCost: number; outputCost: number }>> = {
    [AIModel.GPT_4_TURBO]: { inputCost: 0.01, outputCost: 0.03 },
    [AIModel.GPT_4]: { inputCost: 0.03, outputCost: 0.06 },
    [AIModel.GPT_3_5_TURBO]: { inputCost: 0.0015, outputCost: 0.002 },
    [AIModel.GPT_3_5]: { inputCost: 0.0015, outputCost: 0.002 },
  };

  async generateText(request: AIRequest): Promise<AIResponse> {
    try {
      this.logger.log(`Generating text with OpenAI model: ${request.model}`);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 1,
          frequency_penalty: request.frequencyPenalty ?? 0,
          presence_penalty: request.presencePenalty ?? 0,
          stop: request.stop,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { choices, usage } = response.data;
      const config =
        this.modelConfigs[request.model as AIModel] ??
        this.modelConfigs[AIModel.GPT_4_TURBO]!;

      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        config.inputCost,
        config.outputCost,
      );

      return {
        id: this.generateId(),
        text: choices[0].message.content,
        model: request.model as AIModel,
        provider: AIProviderEnum.OPENAI,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        cost,
        cached: false,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`OpenAI text generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      this.logger.log(`Generating image with OpenAI: ${request.prompt.substring(0, 50)}...`);

      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          prompt: request.prompt,
          model: request.model || 'dall-e-3',
          n: request.quantity || 1,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // OpenAI DALL-E pricing: $0.04 for 1024x1024
      const cost = (request.quantity || 1) * 0.04;

      return {
        id: this.generateId(),
        urls: response.data.data.map((img: any) => img.url),
        model: request.model,
        provider: AIProviderEnum.OPENAI,
        cost,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`OpenAI image generation failed: ${error.message}`);
      throw error;
    }
  }

  async getTokenCount(text: string): Promise<number> {
    try {
      // Using a simple estimation: ~4 chars = 1 token
      // For accurate counting, you'd need to use OpenAI's tokenizer library
      return Math.ceil(text.length / 4);
    } catch (error) {
      this.logger.error(`Token count calculation failed: ${error.message}`);
      return Math.ceil(text.length / 4);
    }
  }

  getAvailableModels(): AIModel[] {
    return [AIModel.GPT_4_TURBO, AIModel.GPT_4, AIModel.GPT_3_5_TURBO, AIModel.GPT_3_5];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      });

      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch (error) {
      this.logger.warn(`OpenAI credentials validation failed: ${error.message}`);
      this.isAvailable = false;
      return false;
    }
  }
}
