/**
 * SocialMediaService — AI-powered social automation
 *
 * Handles:
 *   - Platform-aware post generation & scheduling
 *   - Engagement reply generation
 *   - DM handling with conversation context
 *   - Bulk content scheduling from a content plan
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }              from '../../database/prisma.service';
import { AIGatewayService }           from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                from '../../ai-gateway/types/gateway.types';
import { ConversationMemoryService }  from '../memory/conversation-memory.service';
import { TaskExecutionEngine }        from '../engine/task-execution.engine';
import {
  ChatRequest, ChatResponse,
  PostSpec, EngagementReplyRequest, DMRequest,
  SocialPlatform, SubmittedTask,
} from '../types/assistant.types';

const SOCIAL_SYSTEM = `You are a social media expert AI for BelSuite.
You create compelling, platform-native content that drives engagement and conversions.
You understand each platform's algorithm, tone, and best practices:
- Twitter/X: punchy, max 280 chars, 1-2 hashtags
- Instagram: visual-first, storytelling, 5-10 hashtags
- LinkedIn: professional, thought leadership, value-first
- TikTok: trending audio, hooks in first 2 seconds
- Facebook: community-focused, share-worthy
Always tailor content to the specific platform's style and audience.`;

// Character limits per platform
const CHAR_LIMITS: Record<SocialPlatform, number> = {
  TWITTER:   280,
  INSTAGRAM: 2200,
  LINKEDIN:  3000,
  FACEBOOK:  63206,
  TIKTOK:    2200,
  YOUTUBE:   5000,
};

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AIGatewayService,
    private readonly memory:   ConversationMemoryService,
    private readonly tasks:    TaskExecutionEngine,
  ) {}

  // ── Chat ───────────────────────────────────────────────────────────────

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { organizationId, userId, message } = req;
    const conversationId = await this.memory.getOrCreateConversation(
      organizationId, 'SOCIAL', req.conversationId, userId,
    );
    await this.memory.addMessage(conversationId, 'user', message);
    const history = await this.memory.getHistory(conversationId);

    const response = await this.gateway.generate({
      organizationId, userId,
      task:    GatewayTask.SOCIAL_POST,
      feature: 'social_chat',
      prompt:  message,
      systemPrompt: SOCIAL_SYSTEM,
      maxTokens: 1000,
      routing: { strategy: 'balanced' },
      conversationHistory: history.filter(m => m.role !== 'system'),
    });

    const messageId = await this.memory.addMessage(
      conversationId, 'assistant', response.text,
      { model: response.model, costUsd: response.costUsd },
    );

    return {
      conversationId, messageId,
      reply: response.text, model: response.model,
      tokensUsed: response.tokens.total, costUsd: response.costUsd,
    };
  }

  // ── Content generation ─────────────────────────────────────────────────

  async generatePost(
    organizationId: string,
    platform: SocialPlatform,
    topic:    string,
    options?: {
      tone?:         string;
      cta?:          string;
      brandVoice?:   string;
      includeEmoji?: boolean;
    },
  ): Promise<{ content: string; hashtags: string[]; characterCount: number }> {
    const limit = CHAR_LIMITS[platform];
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SOCIAL');

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Write a ${platform} post.

Topic: ${topic}
Platform: ${platform} (max ${limit} characters)
Tone: ${options?.tone ?? 'engaging and professional'}
${options?.cta       ? `CTA: ${options.cta}` : ''}
${options?.brandVoice ? `Brand voice: ${options.brandVoice}` : ''}
${options?.includeEmoji === false ? 'No emojis.' : 'Include relevant emojis.'}

Return a JSON object (no markdown fences):
{
  "content": string (post body without hashtags, within character limit),
  "hashtags": string[] (without # prefix, max 10)
}`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.SOCIAL_POST,
      `social_${platform.toLowerCase()}`,
      prompt,
      { maxTokens: 600, routing: { strategy: 'fastest' }, useCache: false },
    );

    const parsed = this.parseJSON<{ content: string; hashtags: string[] }>(
      raw, { content: raw.slice(0, limit), hashtags: [] },
    );

    const withHashtags = platform === 'INSTAGRAM' || platform === 'TIKTOK'
      ? `${parsed.content}\n\n${parsed.hashtags.map(h => `#${h}`).join(' ')}`
      : parsed.content;

    return {
      content:        parsed.content,
      hashtags:       parsed.hashtags,
      characterCount: withHashtags.length,
    };
  }

  async generateMultiPlatform(
    organizationId: string,
    topic:    string,
    platforms: SocialPlatform[],
    options?: { tone?: string; cta?: string },
  ): Promise<Record<SocialPlatform, { content: string; hashtags: string[] }>> {
    const results = await Promise.all(
      platforms.map(p => this.generatePost(organizationId, p, topic, options)
        .then(r => ({ platform: p, ...r }))),
    );
    return Object.fromEntries(results.map(r => [r.platform, r])) as any;
  }

  // ── Scheduling ─────────────────────────────────────────────────────────

  async schedulePost(
    organizationId: string,
    userId: string | undefined,
    spec:   PostSpec,
  ): Promise<{ queueItem: any; task: SubmittedTask }> {
    const queueItem = await this.prisma.socialMediaQueueItem.create({
      data: {
        organizationId,
        platform:    spec.platform,
        contentType: 'POST',
        content:     spec.content,
        mediaUrls:   spec.mediaUrls   ?? [],
        hashtags:    spec.hashtags    ?? [],
        scheduledAt: spec.scheduledAt ?? null,
        status:      spec.scheduledAt ? 'SCHEDULED' : 'QUEUED',
      },
    });

    const task = await this.tasks.submit({
      organizationId, userId,
      assistantType: 'SOCIAL',
      taskType:      'SCHEDULE_POST',
      data:          { queueItemId: queueItem.id, platform: spec.platform },
    }, {
      scheduledAt: spec.scheduledAt,
      priority:    5,
    });

    return { queueItem, task };
  }

  async bulkSchedule(
    organizationId: string,
    userId: string | undefined,
    posts:  PostSpec[],
  ): Promise<{ scheduled: number; tasks: SubmittedTask[] }> {
    const tasks: SubmittedTask[] = [];
    for (const post of posts) {
      const { task } = await this.schedulePost(organizationId, userId, post);
      tasks.push(task);
    }
    return { scheduled: posts.length, tasks };
  }

  // ── Engagement replies ─────────────────────────────────────────────────

  async generateEngagementReply(
    organizationId: string,
    req: EngagementReplyRequest,
  ): Promise<string> {
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SOCIAL');

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Generate a ${req.tone ?? 'friendly'} reply to this ${req.platform} comment.

Our post: "${req.postContent.slice(0, 300)}"
Comment from @${req.commenterHandle}: "${req.comment}"

Rules:
- Keep it under 280 characters (even for non-Twitter)
- Sound human and genuine, not corporate
- Acknowledge what they said specifically
- End with a question or CTA when natural
- No hashtags in replies
- Do not start with "Great comment!" or similar generic openers

Reply:`;

    return this.gateway.generateText(
      organizationId,
      GatewayTask.SOCIAL_POST,
      'social_reply',
      prompt,
      { maxTokens: 150, routing: { strategy: 'fastest' }, useCache: false },
    );
  }

  // ── DM handling ────────────────────────────────────────────────────────

  async handleDM(
    organizationId: string,
    userId: string | undefined,
    req: DMRequest,
  ): Promise<{ reply: string; task?: SubmittedTask }> {
    const contextPrompt = await this.memory.buildContextPrompt(organizationId, 'SOCIAL');

    const prevContext = req.previousMessages?.length
      ? `\nPrevious messages:\n${req.previousMessages.map(m => `${m.role === 'us' ? 'Us' : req.senderHandle}: ${m.content}`).join('\n')}\n`
      : '';

    const prompt = `${contextPrompt ? contextPrompt + '\n\n' : ''}Draft a DM reply for ${req.platform}.

${prevContext}
New message from @${req.senderHandle}: "${req.messageContent}"

Write a warm, helpful reply that:
- Addresses their message directly
- Stays in brand voice
- Is under 300 characters
- Includes a soft CTA if relevant (booking a call, checking a link, etc.)

Reply only — no explanation:`;

    const reply = await this.gateway.generateText(
      organizationId,
      GatewayTask.SOCIAL_POST,
      'social_dm',
      prompt,
      { maxTokens: 200, routing: { strategy: 'fastest' }, useCache: false },
    );

    // Queue the actual send as an async task
    const task = await this.tasks.submit({
      organizationId, userId,
      assistantType: 'SOCIAL',
      taskType:      'SEND_DM',
      data:          {
        platform:     req.platform,
        targetHandle: req.senderHandle,
        reply,
        originalMessage: req.messageContent,
      },
    });

    return { reply, task };
  }

  // ── Queue management ───────────────────────────────────────────────────

  async getQueue(
    organizationId: string,
    filters?: { platform?: SocialPlatform; status?: string; limit?: number },
  ) {
    return this.prisma.socialMediaQueueItem.findMany({
      where: {
        organizationId,
        ...(filters?.platform && { platform: filters.platform }),
        ...(filters?.status   && { status:   filters.status }),
      },
      orderBy: { scheduledAt: 'asc' },
      take: filters?.limit ?? 50,
    });
  }

  async cancelPost(organizationId: string, queueItemId: string): Promise<void> {
    await this.prisma.socialMediaQueueItem.update({
      where: { id: queueItemId },
      data:  { status: 'CANCELLED' },
    });
  }

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as T;
    } catch {
      return fallback;
    }
  }
}
