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

import { GatewayRequest, GatewayResponse, GatewayTask, RegisteredModel } from './types/gateway.types';
import { ModelRegistryService } from './services/model-registry.service';
import { AICacheService }        from './services/ai-cache.service';
import { FailoverService }       from './services/failover.service';
import { CostOptimizerService }  from './services/cost-optimizer.service';
import { UsageTrackerService }   from './services/usage-tracker.service';
import { TaskRouterService }     from './services/task-router.service';
import { GatewayControlService } from './services/gateway-control.service';
import { v4 as uuid }           from 'uuid';

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);

  private openai:    OpenAI | null = null;
  private anthropic: any | null = null;

  constructor(
    private readonly config:   ConfigService,
    private readonly registry: ModelRegistryService,
    private readonly cache:    AICacheService,
    private readonly failover: FailoverService,
    private readonly optimizer: CostOptimizerService,
    private readonly usage:    UsageTrackerService,
    private readonly router:   TaskRouterService,
    private readonly control:  GatewayControlService,
  ) {
    this._initProviders();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  async generate(req: GatewayRequest): Promise<GatewayResponse> {
    const featureEnabled = await this.control.isFeatureEnabled(req.feature);
    if (!featureEnabled) {
      throw new BadRequestException(`Feature "${req.feature}" is disabled by admin`);
    }
    const effectiveRouting = await this.resolveRouting(req.routing);
    const usageLimits = await this.control.getUsageLimits();
    const maxTokensPerRequest = Number(usageLimits.maxTokensPerRequest ?? 16000);
    const tenantUsageLimits = await this.control.getTenantUsageLimits();
    const orgLimits = tenantUsageLimits[req.organizationId] ?? {};
    const effectiveTokensLimit = Number(orgLimits.maxTokensPerRequest ?? maxTokensPerRequest);
    if ((req.maxTokens ?? 1024) > effectiveTokensLimit) {
      throw new BadRequestException(`maxTokens exceeds admin limit (${effectiveTokensLimit})`);
    }
    const featureModelLimits = await this.control.getFeatureModelLimits();
    const tenantFeatureModelLimits = await this.control.getTenantFeatureModelLimits();
    const tenantFeatureLimits = tenantFeatureModelLimits[req.organizationId] ?? {};
    const allowedModelIds: string[] | undefined = tenantFeatureLimits[req.feature] ?? featureModelLimits[req.feature];
    const contentTypeProviderModelMap = await this.control.getContentTypeProviderModelMap();

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
        strategy: effectiveRouting.strategy ?? 'balanced',
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
      effectiveRouting,
      Math.ceil(prompt.length / 4),
      req.maxTokens ?? 500,
    );
    const constrainedCandidates = allowedModelIds?.length
      ? plan.candidates.filter((m) => allowedModelIds.includes(m.id))
      : plan.candidates;
    const maxFailoverModels = Number(usageLimits.maxFailoverModels ?? 3);
    const effectiveFailoverLimit = Number(orgLimits.maxFailoverModels ?? maxFailoverModels);
    const candidatePool = constrainedCandidates.slice(0, effectiveFailoverLimit);
    const preferredModelId = this.resolvePreferredModelIdByContentType(req.task, contentTypeProviderModelMap, candidatePool);
    const orderedCandidatePool = preferredModelId
      ? [...candidatePool].sort((a, b) => (a.id === preferredModelId ? -1 : b.id === preferredModelId ? 1 : 0))
      : candidatePool;

    if (orderedCandidatePool.length === 0) {
      throw new ServiceUnavailableException(
        `No AI models available for task "${req.task}" / feature "${req.feature}"`,
      );
    }

    // 5. Failover loop
    const failoverChain: string[] = [];
    let lastError: Error | null = null;

    for (const model of orderedCandidatePool) {
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
            strategy: effectiveRouting.strategy ?? 'balanced',
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

  async testModelCredential(modelIdOrApiIdentifier: string) {
    const all = await this.registry.getAllModels();
    const model =
      all.find((m) => m.id === modelIdOrApiIdentifier) ||
      all.find((m) => m.modelId === modelIdOrApiIdentifier) ||
      all.find((m) => m.apiIdentifier === modelIdOrApiIdentifier);
    if (!model) {
      throw new BadRequestException(`Model not found: ${modelIdOrApiIdentifier}`);
    }

    const task = model.capabilities.includes('image_generation')
      ? GatewayTask.IMAGE_GENERATION
      : model.capabilities.includes('audio_generation')
      ? GatewayTask.AUDIO_TRANSCRIPTION
      : GatewayTask.CHAT;

    const testReq: GatewayRequest = {
      organizationId: this.config.get<string>('ADMIN_AUDIT_ORGANIZATION_ID') ?? 'admin-test-org',
      task,
      feature: 'admin_model_credential_test',
      prompt: 'Credential test ping',
      maxTokens: 64,
      useCache: false,
      routing: { strategy: 'custom', excludedModels: all.filter((m) => m.id !== model.id).map((m) => m.id) },
    };
    const prompt = 'Credential test ping';
    const raw = await this._callProvider(model, testReq, prompt, `test-${Date.now()}`);
    return {
      ok: true,
      model: model.displayName,
      provider: model.provider,
      preview: String(raw.text).slice(0, 160),
    };
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
      const imageUrl = res.data?.[0]?.url ?? '';
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
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
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
    const prefixed = await this._callCatalogExternalModel(model, req, prompt);
    if (prefixed) return prefixed;

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

  private async _callCatalogExternalModel(
    model: RegisteredModel,
    req: GatewayRequest,
    prompt: string,
  ): Promise<
    | {
        text: string;
        model: string;
        provider: any;
        tokens: { input: number; output: number; total: number };
        costUsd: number;
      }
    | null
  > {
    const modelId = model.modelId.toLowerCase();

    // OpenAI-compatible chat adapters
    if (modelId.startsWith('deepseek:')) {
      const creds = await this.resolveModelCredentials(model.modelId);
      return this._callOpenAICompatibleChat(
        creds.apiKey || this.config.get<string>('DEEPSEEK_API_KEY'),
        creds.baseUrl || this.config.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com/v1',
        model.modelId.split(':')[1] ?? model.modelId,
        model,
        req,
        prompt,
      );
    }
    if (modelId.startsWith('qwen:')) {
      const creds = await this.resolveModelCredentials(model.modelId);
      return this._callOpenAICompatibleChat(
        creds.apiKey || this.config.get<string>('QWEN_API_KEY'),
        creds.baseUrl || this.config.get<string>('QWEN_BASE_URL') || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
        model.modelId.split(':')[1] ?? model.modelId,
        model,
        req,
        prompt,
      );
    }
    if (modelId.startsWith('huggingface:')) {
      return this._callHuggingFaceText(model, req, prompt);
    }

    // Image generation providers
    if (
      modelId.startsWith('stability:') ||
      modelId.startsWith('ideogram:') ||
      modelId.startsWith('midjourney:') ||
      modelId.startsWith('black-forest-labs:')
    ) {
      return this._callImageProvider(model, prompt);
    }

    // Video generation providers
    if (
      modelId.startsWith('runway:') ||
      modelId.startsWith('pika:') ||
      modelId.startsWith('luma:') ||
      modelId.startsWith('heygen:') ||
      modelId.startsWith('synthesia:') ||
      modelId.startsWith('haiper:') ||
      modelId.startsWith('kling:') ||
      modelId.startsWith('captions:') ||
      modelId.startsWith('invideo:') ||
      modelId.startsWith('capcut:')
    ) {
      return this._callVideoProvider(model, prompt);
    }

    // Audio generation providers
    if (
      modelId.startsWith('elevenlabs:') ||
      modelId.startsWith('cartesia:') ||
      modelId.startsWith('playht:') ||
      modelId.startsWith('coqui:') ||
      modelId.startsWith('metavoice:')
    ) {
      return this._callAudioProvider(model, prompt);
    }

    return null;
  }

  private async _callOpenAICompatibleChat(
    apiKey: string | undefined,
    baseUrl: string,
    remoteModel: string,
    model: RegisteredModel,
    req: GatewayRequest,
    prompt: string,
  ) {
    if (!apiKey) throw new Error(`Missing API key for ${model.modelId}`);
    const messages = this._buildMessages(req, prompt);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: remoteModel,
        messages,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.7,
      }),
    });
    if (!response.ok) {
      throw new Error(`${model.modelId} API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content ?? '';
    const inputTok = data.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
    const outputTok = data.usage?.completion_tokens ?? Math.ceil(text.length / 4);
    return {
      text,
      model: model.id,
      provider: model.provider,
      tokens: { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd: this.optimizer.estimateCost(model, inputTok, outputTok),
    };
  }

  private async _callHuggingFaceText(
    model: RegisteredModel,
    req: GatewayRequest,
    prompt: string,
  ) {
    const creds = await this.resolveModelCredentials(model.modelId);
    const apiKey = creds.apiKey || this.config.get<string>('HUGGINGFACE_API_KEY');
    if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY');
    const hfModel = model.modelId.split(':')[1] ?? model.modelId;
    const response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: req.maxTokens ?? 512,
          temperature: req.temperature ?? 0.7,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`HuggingFace API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as any;
    const text =
      data?.[0]?.generated_text ??
      data?.generated_text ??
      (typeof data === 'string' ? data : JSON.stringify(data));
    const inputTok = Math.ceil(prompt.length / 4);
    const outputTok = Math.ceil(String(text).length / 4);
    return {
      text: String(text),
      model: model.id,
      provider: model.provider,
      tokens: { input: inputTok, output: outputTok, total: inputTok + outputTok },
      costUsd: this.optimizer.estimateCost(model, inputTok, outputTok),
    };
  }

  private async _callImageProvider(model: RegisteredModel, prompt: string) {
    const creds = await this.resolveModelCredentials(model.modelId);
    const endpoint = creds.endpoint || this.config.get<string>('IMAGE_PROVIDER_ENDPOINT');
    const apiKey = creds.apiKey || this.config.get<string>('IMAGE_PROVIDER_API_KEY');
    if (!endpoint || !apiKey) {
      throw new Error(`Missing IMAGE_PROVIDER_ENDPOINT/API_KEY for ${model.modelId}`);
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: model.modelId, prompt }),
    });
    if (!response.ok) throw new Error(`Image provider error ${response.status}: ${await response.text()}`);
    const data = (await response.json()) as any;
    const imageUrl = data.url ?? data.imageUrl ?? data.output?.[0] ?? '';
    return {
      text: String(imageUrl),
      model: model.id,
      provider: model.provider,
      tokens: { input: 0, output: 0, total: 0 },
      costUsd: this.optimizer.estimateCost(model, 0, 0),
    };
  }

  private async _callVideoProvider(model: RegisteredModel, prompt: string) {
    const creds = await this.resolveModelCredentials(model.modelId);
    const endpoint = creds.endpoint || this.config.get<string>('VIDEO_PROVIDER_ENDPOINT');
    const apiKey = creds.apiKey || this.config.get<string>('VIDEO_PROVIDER_API_KEY');
    if (!endpoint || !apiKey) {
      throw new Error(`Missing VIDEO_PROVIDER_ENDPOINT/API_KEY for ${model.modelId}`);
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: model.modelId, prompt }),
    });
    if (!response.ok) throw new Error(`Video provider error ${response.status}: ${await response.text()}`);
    const data = (await response.json()) as any;
    const descriptor = data.videoUrl ?? data.url ?? data.jobId ?? JSON.stringify(data);
    return {
      text: String(descriptor),
      model: model.id,
      provider: model.provider,
      tokens: { input: 0, output: 0, total: 0 },
      costUsd: this.optimizer.estimateCost(model, 0, 0),
    };
  }

  private async _callAudioProvider(model: RegisteredModel, prompt: string) {
    const creds = await this.resolveModelCredentials(model.modelId);
    const endpoint = creds.endpoint || this.config.get<string>('AUDIO_PROVIDER_ENDPOINT');
    const apiKey = creds.apiKey || this.config.get<string>('AUDIO_PROVIDER_API_KEY');
    if (!endpoint || !apiKey) {
      throw new Error(`Missing AUDIO_PROVIDER_ENDPOINT/API_KEY for ${model.modelId}`);
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: model.modelId, text: prompt }),
    });
    if (!response.ok) throw new Error(`Audio provider error ${response.status}: ${await response.text()}`);
    const data = (await response.json()) as any;
    const descriptor = data.audioUrl ?? data.url ?? data.jobId ?? JSON.stringify(data);
    return {
      text: String(descriptor),
      model: model.id,
      provider: model.provider,
      tokens: { input: 0, output: 0, total: 0 },
      costUsd: this.optimizer.estimateCost(model, 0, 0),
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

  private async _initProviders(): Promise<void> {
    const openaiKey   = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('OpenAI provider initialised');
    } else {
      this.logger.warn('OPENAI_API_KEY not set — OpenAI provider disabled');
    }

    if (anthropicKey) {
      try {
         
        const AnthropicClient = require('@anthropic-ai/sdk').default;
        this.anthropic = new AnthropicClient({ apiKey: anthropicKey });
        this.logger.log('Anthropic provider initialised');
      } catch {
        this.logger.warn('Anthropic SDK not installed — run: npm install @anthropic-ai/sdk');
      }
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — Anthropic provider disabled');
    }
  }

  private async resolveRouting(incoming?: GatewayRequest['routing']) {
    if (incoming) return incoming;
    const profile = await this.control.getControlProfile();
    if (!profile.dynamicEnabled) return { strategy: 'balanced' as const };
    if (profile.mode === 'CHEAP') {
      return { strategy: 'cheapest' as const, preferredProviders: profile.cheapProviders };
    }
    if (profile.mode === 'PREMIUM') {
      return { strategy: 'best_quality' as const, preferredProviders: profile.premiumProviders };
    }
    return { strategy: 'balanced' as const };
  }

  private async resolveModelCredentials(modelId: string): Promise<{
    apiKey?: string;
    baseUrl?: string;
    endpoint?: string;
  }> {
    const map = await this.control.getModelCredentialsMap();
    return map?.[modelId] ?? {};
  }

  private resolvePreferredModelIdByContentType(
    task: GatewayTask,
    map: Record<string, Record<string, string>>,
    candidates: RegisteredModel[],
  ) {
    const contentType = this.taskToContentType(task);
    const providerMap = map?.[contentType];
    if (!providerMap) return null;
    for (const c of candidates) {
      const mappedModelId = providerMap[c.provider];
      if (mappedModelId && mappedModelId === c.id) return c.id;
    }
    return null;
  }

  private taskToContentType(task: GatewayTask): 'text' | 'image' | 'video' | 'ugc' | 'audio' {
    if (task === GatewayTask.IMAGE_GENERATION || task === GatewayTask.IMAGE_EDIT) return 'image';
    if (task === GatewayTask.VIDEO_SCRIPT) return 'video';
    if (task === GatewayTask.AUDIO_TRANSCRIPTION) return 'audio';
    if (task === GatewayTask.SOCIAL_POST || task === GatewayTask.AD_COPY) return 'ugc';
    return 'text';
  }
}
