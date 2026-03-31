/**
 * Auto Creator Service
 * Uses OpenAI GPT-4o-mini to generate platform-optimised social media content,
 * then schedules it via PostSchedulerService.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPlatform } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PostSchedulerService } from './post-scheduler.service';
import { OptimalTimeService } from './optimal-time.service';
import { AutoCreatorDto } from '../dto/social.dto';

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  [SocialPlatform.TWITTER]: 280,
  [SocialPlatform.LINKEDIN]: 3000,
  [SocialPlatform.INSTAGRAM]: 2200,
  [SocialPlatform.FACEBOOK]: 63206,
  [SocialPlatform.TIKTOK]: 2200,
  [SocialPlatform.PINTEREST]: 800,
  [SocialPlatform.WHATSAPP]: 4096,
};

const PLATFORM_TIPS: Record<SocialPlatform, string> = {
  [SocialPlatform.TWITTER]:
    'Keep it concise (max 280 chars). Use 1-2 relevant hashtags. Punchy opening.',
  [SocialPlatform.LINKEDIN]:
    'Professional tone. Use line breaks for readability. 3-5 hashtags. Thought leadership angle.',
  [SocialPlatform.INSTAGRAM]:
    'Conversational and visual storytelling. 5-10 hashtags (relevant). Emoji welcome.',
  [SocialPlatform.FACEBOOK]:
    'Conversational. Can be longer. Include a call-to-action. 1-3 hashtags.',
  [SocialPlatform.TIKTOK]:
    'Trendy, energetic, and youthful. 3-5 hashtags. Include call-to-action.',
  [SocialPlatform.PINTEREST]:
    'Inspirational and descriptive (max 800 chars). Focus on lifestyle benefits. Include keywords for SEO. 5-15 keyword-rich hashtags. Always pair with a link when relevant.',
  [SocialPlatform.WHATSAPP]:
    'Conversational and direct (max 4096 chars). No hashtags — use plain language. Keep messages short, warm, and personal. Include clear next steps or a CTA.',
};

interface GeneratedContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
}

@Injectable()
export class AutoCreatorService {
  private readonly logger = new Logger(AutoCreatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: PostSchedulerService,
    private readonly optimalTime: OptimalTimeService,
    private readonly config: ConfigService,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Generates content for each platform and schedules posts.
   * Returns created post IDs and preview content.
   */
  async generateAndSchedule(
    orgId: string,
    userId: string,
    dto: AutoCreatorDto,
  ) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new BadRequestException('OpenAI API key is not configured.');
    }

    // Resolve connected accounts per platform
    const accounts = dto.accountIds?.length
      ? await this.prisma.socialAccount.findMany({
          where: {
            id: { in: dto.accountIds },
            organizationId: orgId,
            platform: { in: dto.platforms },
            isActive: true,
          },
        })
      : await this.prisma.socialAccount.findMany({
          where: {
            organizationId: orgId,
            platform: { in: dto.platforms },
            isActive: true,
          },
        });

    if (!accounts.length) {
      throw new BadRequestException(
        'No active accounts found for the requested platforms.',
      );
    }

    // Generate content for each platform
    const generated = await this.generateForPlatforms(
      dto.prompt,
      dto.platforms,
      dto.tone,
      openaiKey,
    );

    const createdPosts: Array<{ postId: string; platform: SocialPlatform; preview: string }> = [];

    for (const content of generated) {
      const platformAccounts = accounts.filter(
        (a) => a.platform === content.platform,
      );
      if (!platformAccounts.length) continue;

      // Determine scheduled time
      let scheduledAt: Date | undefined;

      if (dto.useOptimalTime) {
        scheduledAt = await this.optimalTime.getOptimalTime(
          orgId,
          content.platform,
        );
      } else if (dto.scheduledAt) {
        scheduledAt = new Date(dto.scheduledAt);
      }

      try {
        const post = await this.scheduler.createPost(orgId, userId, {
          content: content.content,
          hashtags: content.hashtags,
          accountIds: platformAccounts.map((a) => a.id),
          scheduledAt: scheduledAt?.toISOString(),
          useOptimalTime: dto.useOptimalTime,
        });

        // Mark as AI-generated
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: { aiGenerated: true, aiPrompt: dto.prompt },
        });

        createdPosts.push({
          postId: post.id,
          platform: content.platform,
          preview: content.content.substring(0, 150),
        });
      } catch (err) {
        this.logger.error(
          `Failed to schedule AI post for ${content.platform}: ${(err as Error).message}`,
        );
      }
    }

    return {
      created: createdPosts.length,
      posts: createdPosts,
    };
  }

  /**
   * Generates a single caption + hashtag set for one platform.
   */
  async generateCaption(
    content: string,
    platform: SocialPlatform,
    tone?: string,
  ): Promise<{ caption: string; hashtags: string[] }> {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new BadRequestException('OpenAI API key is not configured.');
    }

    const [result] = await this.generateForPlatforms(
      content,
      [platform],
      tone,
      openaiKey,
    );

    return { caption: result.content, hashtags: result.hashtags };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async generateForPlatforms(
    prompt: string,
    platforms: SocialPlatform[],
    tone: string | undefined,
    openaiKey: string,
  ): Promise<GeneratedContent[]> {
    const platformBlocks = platforms
      .map(
        (p) =>
          `Platform: ${p}\nChar limit: ${CHAR_LIMITS[p]}\nTips: ${PLATFORM_TIPS[p]}`,
      )
      .join('\n\n');

    const systemPrompt = `You are an expert social media copywriter.
Generate compelling, platform-optimised social media posts.
Return a JSON array where each element has:
  - "platform": the platform name (exact match from input)
  - "content": the post text (respecting character limits)
  - "hashtags": an array of hashtags WITHOUT the # symbol

Tone: ${tone ?? 'professional and engaging'}

Platform specifications:
${platformBlocks}

IMPORTANT: Return ONLY valid JSON. No markdown fences, no explanation.`;

    const userMessage = `Create social media posts for the following topic/brief:\n\n${prompt}\n\nGenerate posts for these platforms: ${platforms.join(', ')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new BadRequestException(
        `OpenAI API error: ${(err as any)?.error?.message ?? response.statusText}`,
      );
    }

    const completion = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('OpenAI returned invalid JSON for content generation.');
    }

    // Handle both { posts: [] } and [] response shapes
    const posts: any[] = Array.isArray(parsed)
      ? parsed
      : parsed.posts ?? parsed.data ?? Object.values(parsed)[0] ?? [];

    if (!Array.isArray(posts)) {
      throw new BadRequestException('Unexpected response structure from OpenAI.');
    }

    // Validate and truncate to char limits
    return posts
      .filter((p) => p.platform && p.content)
      .map((p) => {
        const platform = p.platform as SocialPlatform;
        const limit = CHAR_LIMITS[platform] ?? 2200;
        return {
          platform,
          content: String(p.content).substring(0, limit),
          hashtags: Array.isArray(p.hashtags)
            ? p.hashtags.map((h: string) => h.replace(/^#/, ''))
            : [],
        };
      });
  }
}
