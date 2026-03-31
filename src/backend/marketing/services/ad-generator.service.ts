/**
 * Ad Generation Engine
 * Uses the existing AI service to generate ad copy, creatives, and full campaign assets.
 * Produces multiple A/B-ready variants scored by expected performance.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  AdGenerationRequest,
  AdGenerationResult,
  AdCreative,
  AudienceTarget,
  BudgetSuggestion,
  CampaignObjectiveEnum,
  AdPlatformEnum,
  AdFormatEnum,
} from '../marketing.types';

// Platform-specific copy constraints
const PLATFORM_CONSTRAINTS: Record<
  AdPlatformEnum,
  { headlineMax: number; bodyMax: number; ctaOptions: string[] }
> = {
  [AdPlatformEnum.FACEBOOK]: {
    headlineMax: 40,
    bodyMax: 125,
    ctaOptions: [
      'Shop Now',
      'Learn More',
      'Sign Up',
      'Get Offer',
      'Book Now',
      'Download',
    ],
  },
  [AdPlatformEnum.INSTAGRAM]: {
    headlineMax: 40,
    bodyMax: 125,
    ctaOptions: ['Shop Now', 'Learn More', 'Sign Up', 'Get Offer', 'Book Now'],
  },
  [AdPlatformEnum.GOOGLE_SEARCH]: {
    headlineMax: 30,
    bodyMax: 90,
    ctaOptions: [
      'Buy Now',
      'Get a Quote',
      'Learn More',
      'Sign Up Free',
      'Try Free',
    ],
  },
  [AdPlatformEnum.GOOGLE_DISPLAY]: {
    headlineMax: 30,
    bodyMax: 90,
    ctaOptions: ['Learn More', 'Buy Now', 'Sign Up', 'Get Started'],
  },
  [AdPlatformEnum.GOOGLE_YOUTUBE]: {
    headlineMax: 70,
    bodyMax: 150,
    ctaOptions: ['Learn More', 'Shop Now', 'Sign Up', 'Download'],
  },
  [AdPlatformEnum.TIKTOK_ADS]: {
    headlineMax: 50,
    bodyMax: 100,
    ctaOptions: ['Shop Now', 'Learn More', 'Sign Up', 'Download', 'Book Now'],
  },
  [AdPlatformEnum.LINKEDIN_ADS]: {
    headlineMax: 70,
    bodyMax: 150,
    ctaOptions: [
      'Learn More',
      'Sign Up',
      'Register',
      'Download',
      'Get a Demo',
    ],
  },
  [AdPlatformEnum.TWITTER_ADS]: {
    headlineMax: 50,
    bodyMax: 280,
    ctaOptions: ['Learn More', 'Shop Now', 'Sign Up', 'Download'],
  },
};

const OBJECTIVE_PROMPT_HINTS: Record<CampaignObjectiveEnum, string> = {
  [CampaignObjectiveEnum.AWARENESS]:
    'Focus on brand recall, memorable messaging, and broad appeal. Keep it simple and impactful.',
  [CampaignObjectiveEnum.TRAFFIC]:
    'Drive curiosity and clicks. Use compelling hooks and clear value propositions.',
  [CampaignObjectiveEnum.ENGAGEMENT]:
    'Create emotion, ask questions, invite interaction. Be conversational.',
  [CampaignObjectiveEnum.LEADS]:
    'Highlight the offer clearly, reduce friction. Include social proof and urgency.',
  [CampaignObjectiveEnum.CONVERSIONS]:
    'Strong offer, clear benefits, risk-reduction (guarantees, free trial). Drive action NOW.',
  [CampaignObjectiveEnum.APP_INSTALLS]:
    'Highlight the app\'s top feature benefit, show ease of use, include rating if strong.',
  [CampaignObjectiveEnum.VIDEO_VIEWS]:
    'Tease the video content, create suspense or curiosity, make them want to watch.',
};

@Injectable()
export class AdGeneratorService {
  private readonly logger = new Logger(AdGeneratorService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async generateAds(
    organizationId: string,
    req: AdGenerationRequest,
  ): Promise<AdGenerationResult> {
    const variantCount = Math.min(req.variantCount ?? 3, 5);
    const constraints =
      PLATFORM_CONSTRAINTS[req.platform] ??
      PLATFORM_CONSTRAINTS[AdPlatformEnum.FACEBOOK];
    const objectiveHint = OBJECTIVE_PROMPT_HINTS[req.objective];

    const prompt = this.buildAdPrompt(req, constraints, objectiveHint, variantCount);
    const raw = await this.callAI(organizationId, prompt);
    const parsed = this.parseAIResponse(raw, constraints, variantCount);

    const suggestedAudience = this.buildAudienceSuggestion(req);
    const suggestedBudget = this.buildBudgetSuggestion(req, parsed.variants);

    return {
      variants: parsed.variants,
      suggestedAudience,
      suggestedBudget,
      platformTips: this.getPlatformTips(req.platform, req.format),
    };
  }

  /**
   * Save generated ads to the database (creates an Ad per variant)
   */
  async saveGeneratedAds(
    organizationId: string,
    campaignId: string,
    result: AdGenerationResult,
    req: AdGenerationRequest,
  ): Promise<string[]> {
    // Verify campaign belongs to org
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw new BadRequestException('Campaign not found');

    const adIds: string[] = [];
    for (const [i, variant] of result.variants.entries()) {
      const ad = await this.prisma.ad.create({
        data: {
          campaignId,
          name: `${req.productOrService} – Variant ${String.fromCharCode(65 + i)}`,
          format: req.format as any,
          headline: variant.headline.slice(0, 512),
          body: variant.body,
          callToAction: variant.callToAction,
          aiGenerated: true,
          aiPrompt: req.productOrService,
          aiScore: variant.aiScore,
        },
      });
      adIds.push(ad.id);
    }
    return adIds;
  }

  /**
   * Generate image creative prompts for use with DALL-E / Stable Diffusion
   */
  async generateCreativePrompts(
    organizationId: string,
    req: {
      productOrService: string;
      targetAudience: string;
      platform: AdPlatformEnum;
      format: AdFormatEnum;
      tone?: string;
      count?: number;
    },
  ): Promise<Array<{ prompt: string; negativePrompt: string; aspectRatio: string }>> {
    const aspectRatios: Record<string, string> = {
      [AdPlatformEnum.FACEBOOK]: '1.91:1',
      [AdPlatformEnum.INSTAGRAM]: '1:1',
      [AdPlatformEnum.GOOGLE_DISPLAY]: '1.91:1',
      story: '9:16',
    };
    const ar =
      req.format === AdFormatEnum.STORY
        ? aspectRatios.story
        : (aspectRatios[req.platform] ?? '1.91:1');

    const count = Math.min(req.count ?? 2, 4);
    const prompt = `
You are a professional advertising art director.
Generate ${count} distinct image creative prompts for an ad:
- Product/Service: ${req.productOrService}
- Target audience: ${req.targetAudience}
- Platform: ${req.platform}
- Tone: ${req.tone ?? 'professional'}
- Aspect ratio: ${ar}

For each creative, return JSON with:
  { "prompt": "<detailed DALL-E/SD prompt>", "negativePrompt": "<things to avoid>", "aspectRatio": "${ar}" }

Return a JSON array of ${count} objects. No markdown.`;

    const raw = await this.callAI(organizationId, prompt);
    try {
      return JSON.parse(raw.trim()) as Array<{
        prompt: string;
        negativePrompt: string;
        aspectRatio: string;
      }>;
    } catch {
      return [
        {
          prompt: `Professional advertisement for ${req.productOrService}, targeting ${req.targetAudience}, clean modern design, high quality photography`,
          negativePrompt: 'blurry, low quality, text overlay, watermark',
          aspectRatio: ar,
        },
      ];
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildAdPrompt(
    req: AdGenerationRequest,
    constraints: { headlineMax: number; bodyMax: number; ctaOptions: string[] },
    objectiveHint: string,
    variantCount: number,
  ): string {
    return `
You are an elite paid advertising copywriter with 15+ years of experience at top agencies.
Your task: generate ${variantCount} high-converting ad variants.

BUSINESS CONTEXT:
- Business: ${req.businessName}
- Product/Service: ${req.productOrService}
- Target audience: ${req.targetAudience}
- Key benefits: ${(req.keyBenefits ?? []).join(', ') || 'not specified'}
- Brand voice: ${req.brandVoice ?? 'not specified'}
- Tone: ${req.tone ?? 'professional'}

CAMPAIGN CONTEXT:
- Objective: ${req.objective} — ${objectiveHint}
- Platform: ${req.platform}
- Format: ${req.format}

COPY CONSTRAINTS:
- Headline: max ${constraints.headlineMax} characters
- Body: max ${constraints.bodyMax} characters
- CTA must be one of: ${constraints.ctaOptions.join(', ')}

Generate ${variantCount} distinct variants. Each variant must test a DIFFERENT angle:
variant 1: benefit-led, variant 2: problem-led, variant 3: social-proof-led, variant 4: curiosity-led, variant 5: offer-led.

For each variant, return a JSON object:
{
  "headline": "...",
  "body": "...",
  "callToAction": "...",
  "aiScore": <integer 60-99 based on predicted CTR/CVR>,
  "rationale": "<1-sentence why this angle works>"
}

Return a JSON array of ${variantCount} objects. No markdown, no extra text.`;
  }

  private parseAIResponse(
    raw: string,
    constraints: { headlineMax: number; bodyMax: number; ctaOptions: string[] },
    variantCount: number,
  ): { variants: AdCreative[] } {
    try {
      const json = JSON.parse(raw.trim());
      const arr: AdCreative[] = (Array.isArray(json) ? json : [json]).slice(0, variantCount);
      return {
        variants: arr.map((v) => ({
          headline: (v.headline ?? '').slice(0, constraints.headlineMax),
          body: (v.body ?? '').slice(0, constraints.bodyMax),
          callToAction:
            constraints.ctaOptions.includes(v.callToAction)
              ? v.callToAction
              : constraints.ctaOptions[0],
          aiScore: typeof v.aiScore === 'number' ? Math.min(Math.max(v.aiScore, 0), 100) : 70,
          rationale: v.rationale ?? '',
        })),
      };
    } catch {
      // Fallback if AI returns malformed JSON
      return {
        variants: [
          {
            headline: `Discover ${constraints.headlineMax > 30 ? 'How We Can Help You Today' : 'Try It Free Today'}`.slice(0, constraints.headlineMax),
            body: 'Join thousands of satisfied customers. Get started today.'.slice(0, constraints.bodyMax),
            callToAction: constraints.ctaOptions[0],
            aiScore: 65,
            rationale: 'Fallback variant — regenerate for better results.',
          },
        ],
      };
    }
  }

  private buildAudienceSuggestion(req: AdGenerationRequest): AudienceTarget {
    // Heuristic audience based on objective
    const isB2B =
      req.platform === AdPlatformEnum.LINKEDIN_ADS ||
      req.targetAudience.toLowerCase().includes('business') ||
      req.targetAudience.toLowerCase().includes('b2b');

    return {
      ageRange: isB2B ? { min: 25, max: 55 } : { min: 18, max: 45 },
      genders: ['all'],
      interests: req.keyBenefits?.slice(0, 5) ?? [req.productOrService],
      locations: ['United States', 'United Kingdom', 'Canada', 'Australia'],
      behaviors: isB2B
        ? ['Business Decision Makers', 'Small Business Owners']
        : ['Online Shoppers', 'Engaged Buyers'],
    };
  }

  private buildBudgetSuggestion(
    req: AdGenerationRequest,
    variants: AdCreative[],
  ): BudgetSuggestion {
    const topScore = Math.max(...variants.map((v) => v.aiScore), 70);
    const multiplier = topScore / 100;

    // Rough industry benchmarks by objective
    const cpmByObjective: Record<CampaignObjectiveEnum, number> = {
      [CampaignObjectiveEnum.AWARENESS]: 5,
      [CampaignObjectiveEnum.TRAFFIC]: 8,
      [CampaignObjectiveEnum.ENGAGEMENT]: 6,
      [CampaignObjectiveEnum.LEADS]: 15,
      [CampaignObjectiveEnum.CONVERSIONS]: 20,
      [CampaignObjectiveEnum.APP_INSTALLS]: 18,
      [CampaignObjectiveEnum.VIDEO_VIEWS]: 4,
    };

    const daily = req.budget ?? 50;
    const cpm = cpmByObjective[req.objective] ?? 10;
    const dailyImpressions = Math.round((daily / cpm) * 1000);
    const ctr = 0.01 * multiplier + 0.005;

    return {
      daily,
      total: daily * 30,
      currency: 'USD',
      reasoning: `Based on ${req.platform} average CPM of $${cpm} for ${req.objective} campaigns. AI score of ${topScore}/100 indicates ${topScore > 80 ? 'strong' : 'moderate'} expected performance.`,
      expectedImpressions: {
        min: Math.round(dailyImpressions * 0.7),
        max: Math.round(dailyImpressions * 1.3),
      },
      expectedClicks: {
        min: Math.round(dailyImpressions * ctr * 0.7),
        max: Math.round(dailyImpressions * ctr * 1.3),
      },
      expectedConversions: {
        min: Math.round(dailyImpressions * ctr * 0.02),
        max: Math.round(dailyImpressions * ctr * 0.05),
      },
    };
  }

  private getPlatformTips(platform: AdPlatformEnum, format: AdFormatEnum): string[] {
    const tips: Record<AdPlatformEnum, string[]> = {
      [AdPlatformEnum.FACEBOOK]: [
        'Use bright, eye-catching images — avoid blue/white (blends with Facebook UI)',
        'Video ads get 3x higher engagement than image ads',
        'Narrow audience targeting improves CPM and relevance score',
      ],
      [AdPlatformEnum.INSTAGRAM]: [
        'Stories ads perform best with vertical 9:16 creative',
        'User-generated content styles outperform polished ads',
        'Add captions — 85% of videos watched without sound',
      ],
      [AdPlatformEnum.GOOGLE_SEARCH]: [
        'Include your main keyword in the headline 1',
        'Use ad extensions (sitelinks, callouts) to increase CTR by up to 30%',
        'Match landing page content to ad copy for better Quality Score',
      ],
      [AdPlatformEnum.GOOGLE_DISPLAY]: [
        'Use responsive display ads to reach more inventory',
        'Retargeting campaigns get 10x higher CVR than prospecting',
        'Test both in-market and affinity audiences',
      ],
      [AdPlatformEnum.GOOGLE_YOUTUBE]: [
        'First 5 seconds must hook — viewers can skip after that',
        'Include a clear CTA overlay throughout the video',
        'Target custom intent audiences with high purchase intent',
      ],
      [AdPlatformEnum.TIKTOK_ADS]: [
        'Native-feeling content outperforms polished ads dramatically',
        'Use trending sounds and formats for higher reach',
        'First 3 seconds determine whether users continue watching',
      ],
      [AdPlatformEnum.LINKEDIN_ADS]: [
        'Thought leadership content gets 3x more engagement than promotional posts',
        'Target by job title + company size for precise B2B reach',
        'Lead gen forms convert 3x better than landing page clicks',
      ],
      [AdPlatformEnum.TWITTER_ADS]: [
        'Keep it concise — tweets under 100 characters get 17% higher engagement',
        'Images increase retweets by 150%',
        'Use trending hashtags carefully — only when genuinely relevant',
      ],
    };

    const formatTips: Partial<Record<AdFormatEnum, string>> = {
      [AdFormatEnum.CAROUSEL]: 'Put best performing product/feature on card 1',
      [AdFormatEnum.VIDEO]: 'Aim for 15-30 second video for best completion rates',
      [AdFormatEnum.STORY]: 'Add interactive stickers (polls, swipe-up) to boost engagement',
      [AdFormatEnum.RESPONSIVE_SEARCH]: 'Write 10+ headlines to give Google maximum combinations to test',
    };

    const all = [...(tips[platform] ?? [])];
    if (formatTips[format]) all.push(formatTips[format]!);
    return all;
  }

  private async callAI(organizationId: string, prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — returning mock AI response');
      return this.getMockResponse(prompt);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert advertising copywriter. Always respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`OpenAI error: ${err}`);
      return this.getMockResponse(prompt);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? '[]';
  }

  private getMockResponse(_prompt: string): string {
    return JSON.stringify([
      {
        headline: 'Transform Your Business Today',
        body: 'Join 10,000+ businesses already seeing results. Start your free trial now.',
        callToAction: 'Start Free Trial',
        aiScore: 82,
        rationale: 'Benefit-led with social proof drives trust and action.',
      },
      {
        headline: 'Struggling to Grow? We Can Help',
        body: "You shouldn't have to figure this out alone. Our platform handles it for you.",
        callToAction: 'Learn More',
        aiScore: 78,
        rationale: 'Problem-led approach resonates with pain-aware audience.',
      },
      {
        headline: '★★★★★ Rated #1 by Customers',
        body: 'See why thousands choose us every day. Limited time: 30 days free.',
        callToAction: 'Get Offer',
        aiScore: 85,
        rationale: 'Social proof with urgency maximizes conversion intent.',
      },
    ]);
  }
}
