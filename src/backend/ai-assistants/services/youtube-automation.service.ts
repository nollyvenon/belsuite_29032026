/**
 * YouTubeAutomationService
 *
 * Full pipeline:
 *   Script generation → SEO optimization → Thumbnail concepts → Schedule upload
 *
 * Each stage persists state to YouTubeAutomationJob.
 * Upload is queued as an async task (actual YouTube API call handled by processor).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService }              from '../../database/prisma.service';
import { AIGatewayService }           from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                from '../../ai-gateway/types/gateway.types';
import type { ConversationMessage } from '../../ai-gateway/types/gateway.types';
import { ConversationMemoryService }  from '../memory/conversation-memory.service';
import { TaskExecutionEngine }        from '../engine/task-execution.engine';
import {
  ChatRequest, ChatResponse,
  YouTubeScriptSpec, YouTubeScript,
  SEOPackage, ThumbnailConcept, SubmittedTask,
} from '../types/assistant.types';

const YOUTUBE_SYSTEM = `You are a YouTube content strategist and scriptwriter for BelSuite.
You help creators produce high-performing, SEO-optimised YouTube videos.
You understand YouTube's algorithm, retention tactics, and monetisation.
Always structure scripts for maximum retention: strong hook, clear chapters, compelling CTA.`;

@Injectable()
export class YouTubeAutomationService {
  private readonly logger = new Logger(YouTubeAutomationService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AIGatewayService,
    private readonly memory:   ConversationMemoryService,
    private readonly tasks:    TaskExecutionEngine,
  ) {}

  // ── Conversational assistant ───────────────────────────────────────────

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { organizationId, userId, message } = req;
    const conversationId = await this.memory.getOrCreateConversation(
      organizationId, 'YOUTUBE', req.conversationId, userId,
    );
    await this.memory.addMessage(conversationId, 'user', message);
    const history = await this.memory.getHistory(conversationId);

    const conversationHistory: ConversationMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const response = await this.gateway.generate({
      organizationId, userId,
      task:    GatewayTask.VIDEO_SCRIPT,
      feature: 'youtube_chat',
      prompt:  message,
      systemPrompt: YOUTUBE_SYSTEM,
      maxTokens: 1200,
      routing: { strategy: 'balanced' },
      conversationHistory,
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

  // ── Script generation ──────────────────────────────────────────────────

  async generateScript(
    organizationId: string,
    spec: YouTubeScriptSpec,
  ): Promise<{ job: any; script: YouTubeScript }> {
    // Create job record
    const job = await this.prisma.youTubeAutomationJob.create({
      data: {
        organizationId,
        title:          spec.topic,
        topic:          spec.topic,
        targetAudience: spec.targetAudience,
        durationSecs:   spec.durationSecs,
        status:         'SCRIPTING',
      },
    });

    const prompt = `Write a complete YouTube video script.

Topic: ${spec.topic}
Target audience: ${spec.targetAudience}
Target duration: ${spec.durationSecs} seconds (~${Math.round(spec.durationSecs / 60)} minutes)
Tone: ${spec.tone}
Call to action: ${spec.callToAction}
${spec.keyPoints?.length ? `Key points to cover: ${spec.keyPoints.join(', ')}` : ''}

Return a JSON object (no markdown fences):
{
  "title": string (YouTube-optimized, 50-60 chars),
  "hook": string (first 30 seconds — must grab attention immediately),
  "sections": [{ "heading": string, "content": string, "durationSecs": number }],
  "outro": string (subscribe CTA + next video suggestion),
  "bRollSuggestions": string[],
  "estimatedDuration": number (seconds)
}`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.VIDEO_SCRIPT,
      'youtube_script',
      prompt,
      { maxTokens: 4000, routing: { strategy: 'best_quality' } },
    );

    const script = this.parseJSON<YouTubeScript>(raw, {
      title: spec.topic, hook: '', sections: [], outro: '',
      bRollSuggestions: [], estimatedDuration: spec.durationSecs,
    });

    // Persist script
    await this.prisma.youTubeAutomationJob.update({
      where: { id: job.id },
      data: {
        title:  script.title,
        script: JSON.stringify(script),
        status: 'SCRIPT_READY',
      },
    });

    return { job: { ...job, title: script.title, status: 'SCRIPT_READY' }, script };
  }

  // ── SEO optimization ───────────────────────────────────────────────────

  async optimizeSEO(
    organizationId: string,
    jobId:          string,
    rawTitle:       string,
    rawDescription: string,
    niche:          string,
  ): Promise<SEOPackage> {
    const prompt = `Optimise this YouTube video for maximum discoverability.

Raw title: "${rawTitle}"
Raw description: "${rawDescription}"
Niche: ${niche}

Return a JSON object (no markdown fences):
{
  "title": string (< 60 chars, keyword-first),
  "description": string (150-300 chars, first line is hook, include keywords naturally),
  "tags": string[] (up to 15, mix broad + specific),
  "chapters": [{ "timestamp": "0:00", "title": string }],
  "category": string
}`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.SEO_ANALYSIS,
      'youtube_seo',
      prompt,
      { maxTokens: 1000, routing: { strategy: 'balanced' } },
    );

    const seo = this.parseJSON<SEOPackage>(raw, {
      title: rawTitle, description: rawDescription, tags: [], category: niche,
    });

    // Persist SEO data
    await this.prisma.youTubeAutomationJob.update({
      where: { id: jobId },
      data: {
        seoTitle:       seo.title,
        seoDescription: seo.description,
        seoTags:        seo.tags,
        status:         'SEO_DONE',
      },
    });

    return seo;
  }

  // ── Thumbnail concepts ─────────────────────────────────────────────────

  async suggestThumbnails(
    organizationId: string,
    videoTitle:     string,
    niche:          string,
    style:          'bold' | 'minimal' | 'face-forward' | 'text-heavy' = 'bold',
  ): Promise<ThumbnailConcept[]> {
    const prompt = `Generate 4 thumbnail concepts for this YouTube video.

Title: "${videoTitle}"
Niche: ${niche}
Style preference: ${style}

Return a JSON array (no markdown fences):
[{
  "concept": string (1-line description),
  "mainText": string (bold overlay text, < 5 words),
  "backgroundStyle": string,
  "colorScheme": string,
  "faceSuggestion": string (emotion/pose for on-screen talent),
  "moodBoard": string (3 reference keywords)
}]`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.IMAGE_GENERATION,
      'youtube_thumbnail',
      prompt,
      { maxTokens: 800, routing: { strategy: 'fastest' } },
    );

    const concepts = this.parseJSON<ThumbnailConcept[]>(raw, []);

    // Persist thumbnail concepts to job if we have a recent job
    const recentJob = await this.prisma.youTubeAutomationJob.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    if (recentJob) {
      await this.prisma.youTubeAutomationJob.update({
        where: { id: recentJob.id },
        data:  { thumbnailConcepts: concepts as any },
      });
    }

    return concepts;
  }

  // ── Full pipeline ──────────────────────────────────────────────────────

  async runFullPipeline(
    organizationId: string,
    userId:         string | undefined,
    spec:           YouTubeScriptSpec & { niche?: string; publishAt?: Date },
  ): Promise<{ jobId: string; tasks: SubmittedTask[] }> {
    // Create job
    const job = await this.prisma.youTubeAutomationJob.create({
      data: {
        organizationId,
        title:          spec.topic,
        topic:          spec.topic,
        targetAudience: spec.targetAudience,
        durationSecs:   spec.durationSecs,
        publishAt:      spec.publishAt ?? null,
        status:         'DRAFT',
      },
    });

    // Queue all stages as tasks
    const scriptTask = await this.tasks.submit({
      organizationId, userId,
      assistantType: 'YOUTUBE',
      taskType:      'YOUTUBE_GENERATE_SCRIPT',
      data:          { jobId: job.id, spec },
    }, { priority: 2 });

    const seoTask = await this.tasks.submit({
      organizationId, userId,
      assistantType: 'YOUTUBE',
      taskType:      'YOUTUBE_OPTIMIZE_SEO',
      data:          { jobId: job.id, niche: spec.niche ?? 'general' },
    }, { priority: 3 });

    const uploadTask = spec.publishAt
      ? await this.tasks.submit({
          organizationId, userId,
          assistantType: 'YOUTUBE',
          taskType:      'YOUTUBE_SCHEDULE_UPLOAD',
          data:          { jobId: job.id },
        }, { scheduledAt: spec.publishAt, priority: 4 })
      : null;

    return {
      jobId: job.id,
      tasks: [scriptTask, seoTask, ...(uploadTask ? [uploadTask] : [])],
    };
  }

  async getJob(organizationId: string, jobId: string) {
    const job = await this.prisma.youTubeAutomationJob.findFirst({
      where: { id: jobId, organizationId },
    });
    if (!job) throw new NotFoundException(`YouTube job ${jobId} not found`);
    return job;
  }

  async listJobs(organizationId: string, status?: string) {
    return this.prisma.youTubeAutomationJob.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as T;
    } catch {
      this.logger.warn('Failed to parse YouTube JSON response');
      return fallback;
    }
  }
}
