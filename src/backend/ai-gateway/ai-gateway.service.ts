/**
 * AI Gateway Service — Central Brain
 *
 * Entry point for every AI operation in BelSuite.
 * Orchestrates:
 *   1. Budget check
 *   2. Cache lookup
 *   3. Task routing (model selection)
 *   4. Provider call with failover loop
 *   5. Cache write
 *   6. Usage tracking
 *
 * All provider adapters are thin wrappers called via the _callProvider method.
 * Add a new provider by implementing the ProviderAdapter interface below.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

import { GatewayRequest, GatewayResponse, GatewayTask, RegisteredModel } from './types/gateway.types';
import { ModelRegistryService } from './services/model-registry.service';
import { AICacheService }        from './services/ai-cache.service';
import { FailoverService }       from './services/failover.service';
import { CostOptimizerService }  from './services/cost-optimizer.service';
import { UsageTrackerService }   from './services/usage-tracker.service';
import { TaskRouterService }     from './services/task-router.service';
import { v4 as uuid }           from 'uuid';

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);

  private openai:    OpenAI    | null = null;
  private anthropic: Anthropic | null = null;

  constructor(
    private readonly config:   ConfigService,
    private readonly registry: ModelRegistryService,
    private readonly cache:    AICacheService,
    private readonly failover: FailoverService,
    private readonly optimizer: CostOptimizerService,
    private readonly usage:    UsageTrackerService,
    private readonly router:   TaskRouterService,
  ) {
    this._initProviders();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  async generate(req: GatewayRequest): Promise<GatewayResponse> {
    const start      = Date.now();
    const requestId  = uuid();
    const prompt     = typeof req.prompt === 'string' ? req.prompt : JSON.stringify(req.prompt);

    // 1. Estimate cost for budget check
    const allEnabled = await this.registry.getAllModels();
    const cheapest   = this.optimizer.selectModel(allEnabled, { strategy: 'cheapest' });
    const estimatedCost = cheapest
      ? this.optimizer.estimateCostFromText(cheapest, prompt, req.maxTokens ?? 500)
      : 0;

    // 2. Budget check (throws ForbiddenException if exceeded)
    await this.usage.checkBudget(req.organizationId, estimatedCost);

    // 3. Cache lookup
    if (req.useCache !== false) {
      const cacheKey = this.cache.buildKey(prompt, req.task, {
        feature: req.feature,
        strategy: req.routing?.strategy ?? 'balanced',
      });
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT for request ${requestId}`);
        await this.usage.trackRequest(req, { ...cached, requestId }, cached.model, 0);
        return { ...cached, requestId };
      }
    }

    // 4. Build routing plan
    const plan = await this.router.buildPlan(
      req.task,
      req.feature,
      req.routing ?? { strategy: 'balanced' },
      Math.ceil(prompt.length / 4),
      req.maxTokens ?? 500,
    );

    if (plan.candidates.length === 0) {
      throw new ServiceUnavailableException(
        `No AI models available for task "${req.task}" / feature "${req.feature}"`,
      );
    }

    // 5. Failover loop
    const failoverChain: string[] = [];
    let lastError: Error | null = null;

    for (const model of plan.candidates) {
      if (!this.failover.canAttempt(model.id)) {
        this.logger.debug(`Skipping ${model.displayName} — circuit open`);
        continue;
      }

      try {
        const callStart = Date.now();
        const raw       = await this._callProvider(model, req, prompt, requestId);
        const latency   = Date.now() - callStart;

        this.failover.recordSuccess(model.id, latency);

        const response: GatewayResponse = {
          ...raw,
          requestId,
          latencyMs:    latency,
          failoverUsed: failoverChain.length > 0,
          failoverChain: failoverChain.length > 0 ? [...failoverChain] : undefined,
          cacheHit:     false,
        };

        // 6. Cache write
        if (req.useCache !== false) {
          const cacheKey = this.cache.buildKey(prompt, req.task, {
            feature: req.feature,
            strategy: req.routing?.strategy ?? 'balanced',
          });
          await this.cache.set(cacheKey, response, req.cacheTtlSeconds);
        }

        // 7. Track usage
        await this.usage.trackRequest(req, response, model.id, latency);

        return response;

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Model ${model.displayName} failed: ${errMsg}`);
        this.failover.recordFailure(model.id, errMsg);
        await this.usage.trackFailedRequest(
          req, model.id, model.provider, 'PROVIDER_ERROR', errMsg,
        );
        failoverChain.push(model.id);
        lastError = err instanceof Error ? err : new Error(errMsg);
      }
    }

    throw new ServiceUnavailableException(
      `All AI providers failed for task "${req.task}". Last error: ${lastError?.message ?? 'unknown'}`,
    );
  }

  /** Text-only convenience wrapper */
  async generateText(
    organizationId: string,
    task: GatewayTask,
    feature: string,
    prompt: string,
    options: Partial<GatewayRequest> = {},
  ): Promise<string> {
    const res = await this.generate({
      organizationId,
      task,
      feature,
      prompt,
      ...options,
    });
    return res.text;
  }

  // ── Provider dispatch ──────────────────────────────────────────────────

  private async _callProvider(
    model:     RegisteredModel,
    req:       GatewayRequest,
    prompt:    string,
    requestId: string,
  ): Promise<Omit<GatewayResponse, 'requestId' | 'latencyMs' | 'failoverUsed' | 'failoverChain' | 'cacheHit'>> {
    switch (model.provider) {
      case 'OPENAI':
        return this._callOpenAI(model, req, prompt);
      case 'CLAUDE':
        return this._callClaude(model, req, prompt);
      case 'GEMINI':
        return this._callGemini(model, req, prompt);
      case 'LOCAL':
        return this._callLocal(model, req, prompt);
      default:
        throw new BadRequestException(`Unknown provider: ${model.provider}`);
    }
  }

  // ── OpenAI ─────────────────────────────────────────────────────────────

  private async _callOpenAI(
    model: RegisteredModel,
    req:   GatewayRequest,
    prompt: string,
  ) {
    if (!this.openai) throw new Error('OpenAI client not initialised (missing API key)');

    // Image generation
    if (model.capabilities.includes('image_generation')) {
      const res = await this.openai.images.generate({
        model:  model.modelId,
        prompt,
        n:      1,
        size:   '1024x1024',
      });
      const imageUrl = res.data[0]?.url ?? '';
      return {
        text:     imageUrl,
        model:    model.id,
        provider: model.provider,
        tokens:   { input: 0, output: 0, total: 0 },
        costUsd:  model.costPerOutputToken * 1, // per image
      };
    }

    // Text generation
    const messages = this._buildMessages(req, prompt);
    const completion = await this.openai.chat.completions.create({
      model:      model.modelId,
      messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    });

    const choice     = completion.choices[0];
    const inputTok   = completion.usage?.prompt_tokens     ?? 0;
    const outputTok  = completion.usage?.completion_tokens ?? 0;

    return {
      text:     choice.message.content ?? '',
      model:    model.id,
      provider: model.provider,
      tokens:   { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd:  this.optimizer.estimateCost(model, inputTok, outputTok),
    };
  }

  // ── Anthropic / Claude ─────────────────────────────────────────────────

  private async _callClaude(
    model:  RegisteredModel,
    req:    GatewayRequest,
    prompt: string,
  ) {
    if (!this.anthropic) throw new Error('Anthropic client not initialised (missing API key)');

    const systemPrompt = req.systemPrompt ?? 'You are a helpful AI assistant for BelSuite.';

    const message = await this.anthropic.messages.create({
      model:      model.modelId,
      max_tokens: req.maxTokens ?? 1024,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: prompt }],
    });

    const inputTok  = message.usage.input_tokens;
    const outputTok = message.usage.output_tokens;
    const text      = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    return {
      text,
      model:    model.id,
      provider: model.provider,
      tokens:   { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd:  this.optimizer.estimateCost(model, inputTok, outputTok),
    };
  }

  // ── Gemini ─────────────────────────────────────────────────────────────

  private async _callGemini(
    model:  RegisteredModel,
    req:    GatewayRequest,
    prompt: string,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Gemini API key not configured');

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: req.maxTokens ?? 1024,
        temperature:     req.temperature ?? 0.7,
      },
    };

    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const inputTok  = data.usageMetadata?.promptTokenCount    ?? Math.ceil(prompt.length / 4);
    const outputTok = data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);

    return {
      text,
      model:    model.id,
      provider: model.provider,
      tokens:   { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd:  this.optimizer.estimateCost(model, inputTok, outputTok),
    };
  }

  // ── Local (Ollama) ─────────────────────────────────────────────────────

  private async _callLocal(
    model:  RegisteredModel,
    req:    GatewayRequest,
    prompt: string,
  ) {
    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:  model.modelId,
        prompt,
        stream: false,
        options: {
          num_predict: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as any;
    const text      = data.response ?? '';
    const inputTok  = data.prompt_eval_count  ?? Math.ceil(prompt.length / 4);
    const outputTok = data.eval_count          ?? Math.ceil(text.length / 4);

    return {
      text,
      model:    model.id,
      provider: model.provider,
      tokens:   { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd:  0, // local — no cost
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private _buildMessages(
    req:    GatewayRequest,
    prompt: string,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }

    if (req.conversationHistory) {
      for (const m of req.conversationHistory) {
        messages.push({ role: m.role as any, content: m.content });
      }
    }

    messages.push({ role: 'user', content: prompt });
    return messages;
  }

  private _initProviders(): void {
    const openaiKey   = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('OpenAI provider initialised');
    } else {
      this.logger.warn('OPENAI_API_KEY not set — OpenAI provider disabled');
    }

    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      this.logger.log('Anthropic provider initialised');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — Anthropic provider disabled');
    }
  }
}
