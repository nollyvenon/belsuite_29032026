/**
 * Local Model Provider Implementation (Ollama)
 * Handles integration with local models via Ollama
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
export class LocalModelProvider extends BaseAIProvider {
  name = 'Local (Ollama)';
  isAvailable = true;
  private readonly logger = new Logger(LocalModelProvider.name);
  private readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  // Local models have $0 cost
  private modelConfigs = {
    [AIModel.OLLAMA_LLAMA2]: { inputCost: 0, outputCost: 0 },
    [AIModel.OLLAMA_MISTRAL]: { inputCost: 0, outputCost: 0 },
  };

  async generateText(request: AIRequest): Promise<AIResponse> {
    try {
      this.logger.log(`Generating text with local model: ${request.model}`);

      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: request.model.replace('ollama:', ''),
          prompt: request.prompt,
          stream: false,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 1,
        },
        { timeout: 60000 }, // Local models might take longer
      );

      const { response: text, eval_count, prompt_eval_count } = response.data;

      const cost = this.calculateCost(
        prompt_eval_count || 0,
        eval_count || 0,
        0,
        0,
      );

      return {
        id: this.generateId(),
        text: text.trim(),
        model: request.model,
        provider: AIProviderEnum.LOCAL,
        tokens: {
          prompt: prompt_eval_count || 0,
          completion: eval_count || 0,
          total: (prompt_eval_count || 0) + (eval_count || 0),
        },
        cost,
        cached: false,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Local model generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Local models typically don't support image generation
    throw new Error('Local models do not support image generation. Use OpenAI or another provider.');
  }

  async getTokenCount(text: string): Promise<number> {
    try {
      // For local models, use estimation
      return Math.ceil(text.length / 4);
    } catch (error) {
      this.logger.error(`Token count calculation failed: ${error.message}`);
      return Math.ceil(text.length / 4);
    }
  }

  getAvailableModels(): AIModel[] {
    return [AIModel.OLLAMA_LLAMA2, AIModel.OLLAMA_MISTRAL];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch (error) {
      this.logger.warn(`Local model validation failed: ${error.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName },
        { timeout: 300000 }, // Can take a while to download
      );
      this.logger.log(`Model pulled successfully: ${modelName}`);
    } catch (error) {
      this.logger.error(`Failed to pull model: ${error.message}`);
      throw error;
    }
  }
}
