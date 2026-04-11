/**
 * SierrAI — Executive Strategy Assistant
 *
 * Handles:
 *   - Conversational strategy sessions
 *   - Content planning & campaign ideation
 *   - Business insights from org data
 *
 * Uses best_quality routing (Claude Opus / GPT-4o) for deep reasoning.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../common/events/event.bus';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService }             from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                  from '../../ai-gateway/types/gateway.types';
import type { ConversationMessage } from '../../ai-gateway/types/gateway.types';
import { ConversationMemoryService }    from '../memory/conversation-memory.service';
import { TaskExecutionEngine }          from '../engine/task-execution.engine';
import {
  ChatRequest, ChatResponse,
  StrategySuggestion, ContentPlan, BusinessInsight,
} from '../types/assistant.types';

const SIERRA_SYSTEM = `You are SierrAI, an elite executive AI assistant for BelSuite.
You help founders, CMOs, and marketing leaders with:
- Growth strategy and market positioning
- Content strategy and campaign planning
- Business performance analysis
- Decision-making frameworks

Personality: confident, direct, data-driven. Always ask a clarifying follow-up when the user's goal is unclear.
When you identify an action that can be automated (scheduling, posting, creating events), say so and offer to queue it.
Format responses with clear headings when longer than 3 sentences.`;

@Injectable()
export class SierrAIService {
  private readonly logger = new Logger(SierrAIService.name);

  constructor(
    private readonly gateway: AIGatewayService,
    private readonly memory:  ConversationMemoryService,
    private readonly tasks:   TaskExecutionEngine,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  // ── Conversational chat ────────────────────────────────────────────────

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { organizationId, userId, message } = req;

    // Get or create thread
    const conversationId = await this.memory.getOrCreateConversation(
      organizationId, 'SIERRA', req.conversationId, userId,
    );

    // Persist user message
    await this.memory.addMessage(conversationId, 'user', message);

    // Build context-enriched system prompt
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SIERRA');
    const systemPrompt  = contextPrompt
      ? `${SIERRA_SYSTEM}\n\n${contextPrompt}`
      : SIERRA_SYSTEM;

    // Retrieve conversation history
    const history = await this.memory.getHistory(conversationId);

    // Call gateway (best_quality — Sierra is the strategy brain)
    const conversationHistory: ConversationMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const response = await this.gateway.generate({
      organizationId,
      userId,
      task:    GatewayTask.BUSINESS_INSIGHTS,
      feature: 'sierra_chat',
      prompt:  message,
      systemPrompt,
      maxTokens: 1500,
      routing: { strategy: 'best_quality' },
      conversationHistory,
    });

    // Persist assistant reply
    const messageId = await this.memory.addMessage(
      conversationId,
      'assistant',
      response.text,
      { model: response.model, costUsd: response.costUsd },
    );

    await this.persistStrategyArtifact(organizationId, userId, conversationId, messageId, response.text);

    // Auto-title conversation from first exchange
    const msgCount = history.filter(m => m.role === 'user').length;
    if (msgCount === 0) {
      const title = message.slice(0, 60) + (message.length > 60 ? '…' : '');
      await this.memory.updateConversationTitle(conversationId, title);
    }

    return {
      conversationId,
      messageId,
      reply:      response.text,
      model:      response.model,
      tokensUsed: response.tokens.total,
      costUsd:    response.costUsd,
    };
  }

  // ── Strategy suggestions ───────────────────────────────────────────────

  async suggestStrategy(
    organizationId: string,
    context: {
      currentRevenue?: string;
      topChallenge?:   string;
      targetMarket?:   string;
      timeframe?:      string;
    },
  ): Promise<StrategySuggestion[]> {
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SIERRA');

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Generate 4 concrete, actionable strategic suggestions for a digital marketing & content business.

Context:
${context.currentRevenue ? `- Current revenue: ${context.currentRevenue}` : ''}
${context.topChallenge   ? `- Top challenge: ${context.topChallenge}`     : ''}
${context.targetMarket   ? `- Target market: ${context.targetMarket}`     : ''}
${context.timeframe      ? `- Timeframe: ${context.timeframe}`            : ''}

Respond with a JSON array (no markdown fences) matching this schema:
[{
  "title": string,
  "summary": string (1-2 sentences),
  "rationale": string,
  "impactLevel": "low"|"medium"|"high",
  "effort": "low"|"medium"|"high",
  "nextSteps": string[],
  "estimatedTimeframe": string
}]`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.BUSINESS_INSIGHTS,
      'sierra_strategy',
      prompt,
      { maxTokens: 2000, routing: { strategy: 'best_quality' } },
    );

    return this.parseJSON<StrategySuggestion[]>(raw, []);
  }

  // ── Content planning ───────────────────────────────────────────────────

  async planContent(
    organizationId: string,
    goals:     string[],
    timeframe: string,
    platforms: string[],
  ): Promise<ContentPlan> {
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SIERRA');

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Create a detailed content plan.

Goals: ${goals.join(', ')}
Timeframe: ${timeframe}
Platforms: ${platforms.join(', ')}

Return a single JSON object (no markdown fences) matching:
{
  "period": string,
  "theme": string,
  "platforms": string[],
  "posts": [{ "week": number, "platform": string, "format": string, "topic": string, "cta": string, "targetAudience": string }],
  "kpis": string[]
}
Include at least 12 post ideas spread across the platforms.`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.CONTENT_LONG_FORM,
      'sierra_content_plan',
      prompt,
      { maxTokens: 3000, routing: { strategy: 'best_quality' } },
    );

    return this.parseJSON<ContentPlan>(raw, {
      period: timeframe, theme: '', platforms, posts: [], kpis: [],
    });
  }

  // ── Business insights ──────────────────────────────────────────────────

  async generateInsights(
    organizationId: string,
    metrics: {
      monthlyRevenue?: number;
      churnRate?:      number;
      activeUsers?:    number;
      topFeature?:     string;
      recentCampaigns?: string[];
    },
  ): Promise<BusinessInsight[]> {
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SIERRA');

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Analyse the following business metrics and generate 5 strategic insights.

Metrics:
${JSON.stringify(metrics, null, 2)}

Return a JSON array (no markdown fences):
[{
  "category": "revenue"|"growth"|"retention"|"brand"|"ops",
  "insight": string,
  "dataPoints": string[],
  "recommendation": string,
  "priority": "low"|"medium"|"high"|"critical"
}]`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.BUSINESS_INSIGHTS,
      'sierra_insights',
      prompt,
      { maxTokens: 2000, routing: { strategy: 'best_quality' } },
    );

    return this.parseJSON<BusinessInsight[]>(raw, []);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.warn('Failed to parse Sierra JSON response');
      return fallback;
    }
  }

  private async persistStrategyArtifact(
    organizationId: string,
    userId: string | undefined,
    conversationId: string,
    messageId: string,
    reply: string,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'sierra.strategy.generated',
        properties: JSON.stringify({
          conversationId,
          messageId,
          reply,
        }),
      },
    });

    await this.eventBus.publish({
      id: `sierra-strategy-${messageId}`,
      type: 'sierra.strategy.generated',
      tenantId: organizationId,
      userId,
      data: {
        conversationId,
        messageId,
        reply,
      },
      timestamp: new Date(),
      correlationId: conversationId,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'sierra-ai',
      },
    });

    await this.prisma.activity.create({
      data: {
        organizationId,
        title: 'Strategy insight generated',
        description: reply.slice(0, 500),
        aiGenerated: true,
        sourceEventType: 'sierra.strategy.generated',
        sourceEventId: messageId,
      } as any,
    });
  }
}
