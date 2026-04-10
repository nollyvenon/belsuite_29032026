/**
 * ConversationMemoryService
 *
 * Two-tier memory:
 *   1. Short-term  — full message history for the current conversation thread
 *   2. Long-term   — rolling context per org+assistant (facts, goals, decisions)
 *
 * When a thread exceeds SUMMARY_THRESHOLD messages the service automatically
 * compresses the oldest half into a summary using the AI Gateway, keeping the
 * context window manageable without losing important history.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../../ai-gateway/ai-gateway.service';
import { GatewayTask } from '../../ai-gateway/types/gateway.types';
import {
  AssistantType,
  ChatMessage,
  AssistantContextData,
} from '../types/assistant.types';

const SUMMARY_THRESHOLD = 30;   // compress after this many messages
const HISTORY_LIMIT     = 20;   // messages returned to the LLM
const CONTEXT_WINDOW    = 12;   // recent messages always kept verbatim

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AIGatewayService,
  ) {}

  // ── Conversations ──────────────────────────────────────────────────────

  async createConversation(
    organizationId: string,
    assistantType:  AssistantType,
    userId?:        string,
    title?:         string,
  ): Promise<string> {
    const conv = await this.prisma.aIConversation.create({
      data: { organizationId, assistantType, userId: userId ?? null, title: title ?? null },
    });
    return conv.id;
  }

  async getOrCreateConversation(
    organizationId: string,
    assistantType:  AssistantType,
    conversationId?: string,
    userId?:        string,
  ): Promise<string> {
    if (conversationId) {
      const existing = await this.prisma.aIConversation.findFirst({
        where: { id: conversationId, organizationId, isActive: true },
      });
      if (existing) return existing.id;
    }
    return this.createConversation(organizationId, assistantType, userId);
  }

  // ── Messages ───────────────────────────────────────────────────────────

  async addMessage(
    conversationId: string,
    role:           string,
    content:        string,
    metadata?:      Record<string, unknown>,
  ): Promise<string> {
    const msg = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: (metadata as any) ?? undefined,
      },
    });

    // Auto-compress if thread is getting long
    const count = await this.prisma.aIMessage.count({ where: { conversationId } });
    if (count > SUMMARY_THRESHOLD) {
      this.compressHistory(conversationId).catch(() => {});
    }

    return msg.id;
  }

  /**
   * Returns the last N messages ready to pass to an LLM.
   * Prepends a system message containing the rolling summary (if any).
   */
  async getHistory(
    conversationId: string,
    limit = HISTORY_LIMIT,
  ): Promise<ChatMessage[]> {
    const [conv, messages] = await Promise.all([
      this.prisma.aIConversation.findUnique({
        where: { id: conversationId },
        select: { summary: true },
      }),
      this.prisma.aIMessage.findMany({
        where:   { conversationId },
        orderBy: { createdAt: 'desc' },
        take:    limit,
      }),
    ]);

    const history: ChatMessage[] = messages
      .reverse()
      .map(m => ({ role: m.role as ChatMessage['role'], content: m.content }));

    // Prepend rolling summary as a system message
    if (conv?.summary) {
      history.unshift({
        role:    'system',
        content: `[Conversation summary so far]: ${conv.summary}`,
      });
    }

    return history;
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data:  { title },
    });
  }

  async closeConversation(conversationId: string): Promise<void> {
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data:  { isActive: false },
    });
  }

  // ── Long-term context ──────────────────────────────────────────────────

  async getContext(
    organizationId: string,
    assistantType:  AssistantType,
  ): Promise<AssistantContextData> {
    const record = await this.prisma.aIAssistantContext.findUnique({
      where: { organizationId_assistantType: { organizationId, assistantType } },
    });
    return (record?.contextData as AssistantContextData) ?? {};
  }

  async updateContext(
    organizationId: string,
    assistantType:  AssistantType,
    updates:        Partial<AssistantContextData>,
  ): Promise<void> {
    const existing = await this.getContext(organizationId, assistantType);
    const merged   = { ...existing, ...updates };

    await this.prisma.aIAssistantContext.upsert({
      where:  { organizationId_assistantType: { organizationId, assistantType } },
      update: { contextData: merged as any },
      create: { organizationId, assistantType, contextData: merged as any },
    });
  }

  /** Build a compact context string to inject into system prompts */
  async buildContextPrompt(
    organizationId: string,
    assistantType:  AssistantType,
  ): Promise<string> {
    const ctx = await this.getContext(organizationId, assistantType);
    if (Object.keys(ctx).length === 0) return '';

    const lines: string[] = ['[Organisation context you remember]:'];
    if (ctx.orgName)            lines.push(`- Company: ${ctx.orgName}`);
    if (ctx.orgGoals?.length)   lines.push(`- Goals: ${ctx.orgGoals.join(', ')}`);
    if (ctx.preferredTone)      lines.push(`- Preferred tone: ${ctx.preferredTone}`);
    if (ctx.activeProjects?.length) lines.push(`- Active projects: ${ctx.activeProjects.join(', ')}`);
    if (ctx.preferredPlatforms?.length) lines.push(`- Preferred platforms: ${ctx.preferredPlatforms.join(', ')}`);
    if (ctx.recentDecisions?.length) {
      const last = ctx.recentDecisions.slice(-3);
      lines.push(`- Recent decisions: ${last.map(d => d.summary).join('; ')}`);
    }

    return lines.join('\n');
  }

  // ── Private: history compression ──────────────────────────────────────

  private async compressHistory(conversationId: string): Promise<void> {
    const messages = await this.prisma.aIMessage.findMany({
      where:   { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Keep the last CONTEXT_WINDOW messages verbatim; compress the rest
    const toCompress = messages.slice(0, messages.length - CONTEXT_WINDOW);
    if (toCompress.length < 10) return;

    const conv = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: { organizationId: true, assistantType: true, summary: true },
    });
    if (!conv) return;

    const transcript = toCompress
      .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`)
      .join('\n');

    const prevSummary = conv.summary ? `Previous summary: ${conv.summary}\n\n` : '';
    const prompt = `${prevSummary}Conversation transcript:\n${transcript}\n\nSummarise the key points, decisions, and important context from this conversation in 3-5 sentences. Be concise and factual.`;

    try {
      const summary = await this.gateway.generateText(
        conv.organizationId,
        GatewayTask.SUMMARIZATION,
        'conversation_compression',
        prompt,
        { maxTokens: 300, routing: { strategy: 'cheapest' } },
      );

      // Update summary, delete compressed messages
      await this.prisma.$transaction([
        this.prisma.aIConversation.update({
          where: { id: conversationId },
          data:  { summary },
        }),
        this.prisma.aIMessage.deleteMany({
          where: { id: { in: toCompress.map(m => m.id) } },
        }),
      ]);

      this.logger.debug(`Compressed ${toCompress.length} messages for conversation ${conversationId}`);
    } catch (err) {
      this.logger.warn(`History compression failed: ${String(err)}`);
    }
  }
}
