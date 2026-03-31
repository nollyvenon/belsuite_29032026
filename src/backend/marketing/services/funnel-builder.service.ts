/**
 * Funnel Builder Service
 * Create, manage, and AI-generate sales funnels with landing pages.
 * Tracks page-level conversion metrics.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { FunnelBlock, GenerateFunnelRequest } from '../marketing.types';

@Injectable()
export class FunnelBuilderService {
  private readonly logger = new Logger(FunnelBuilderService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async listFunnels(organizationId: string) {
    return this.prisma.funnel.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { pages: true } },
        pages: {
          select: { id: true, title: true, views: true, conversions: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getFunnel(organizationId: string, funnelId: string) {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, organizationId },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
    if (!funnel) throw new NotFoundException('Funnel not found');
    return funnel;
  }

  async createFunnel(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      slug: string;
      domain?: string;
      themeJson?: string;
    },
  ) {
    // Enforce unique slug within org
    const existing = await this.prisma.funnel.findFirst({
      where: { organizationId, slug: data.slug },
    });
    if (existing) throw new ConflictException('A funnel with this slug already exists');

    return this.prisma.funnel.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        slug: data.slug,
        domain: data.domain,
        themeJson: data.themeJson,
      },
    });
  }

  async updateFunnel(
    organizationId: string,
    funnelId: string,
    data: {
      name?: string;
      description?: string;
      domain?: string;
      themeJson?: string;
    },
  ) {
    await this.assertOwnership(organizationId, funnelId);
    return this.prisma.funnel.update({ where: { id: funnelId }, data });
  }

  async publishFunnel(organizationId: string, funnelId: string) {
    await this.assertOwnership(organizationId, funnelId);
    return this.prisma.funnel.update({
      where: { id: funnelId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async unpublishFunnel(organizationId: string, funnelId: string) {
    await this.assertOwnership(organizationId, funnelId);
    return this.prisma.funnel.update({
      where: { id: funnelId },
      data: { status: 'DRAFT' },
    });
  }

  async deleteFunnel(organizationId: string, funnelId: string) {
    await this.assertOwnership(organizationId, funnelId);
    await this.prisma.funnel.delete({ where: { id: funnelId } });
  }

  // ─── Pages ────────────────────────────────────────────────────────────────────

  async addPage(
    organizationId: string,
    funnelId: string,
    data: {
      pageType: string;
      title: string;
      slug: string;
      blocksJson?: string;
      ctaText?: string;
      ctaUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    },
  ) {
    await this.assertOwnership(organizationId, funnelId);

    // Get current max order
    const maxPage = await this.prisma.funnelPage.findFirst({
      where: { funnelId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (maxPage?.order ?? -1) + 1;

    return this.prisma.funnelPage.create({
      data: { funnelId, order, ...data },
    });
  }

  async updatePage(
    organizationId: string,
    pageId: string,
    data: {
      title?: string;
      blocksJson?: string;
      ctaText?: string;
      ctaUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    },
  ) {
    const page = await this.prisma.funnelPage.findFirst({
      where: { id: pageId, funnel: { organizationId } },
    });
    if (!page) throw new NotFoundException('Page not found');
    return this.prisma.funnelPage.update({ where: { id: pageId }, data });
  }

  async reorderPages(
    organizationId: string,
    funnelId: string,
    pageIds: string[],
  ) {
    await this.assertOwnership(organizationId, funnelId);
    await Promise.all(
      pageIds.map((id, index) =>
        this.prisma.funnelPage.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async deletePage(organizationId: string, pageId: string) {
    const page = await this.prisma.funnelPage.findFirst({
      where: { id: pageId, funnel: { organizationId } },
    });
    if (!page) throw new NotFoundException('Page not found');
    await this.prisma.funnelPage.delete({ where: { id: pageId } });
  }

  // ─── AI Generation ────────────────────────────────────────────────────────────

  /**
   * AI-generates a full funnel with pages and blocks based on the request.
   */
  async generateFunnelWithAI(
    organizationId: string,
    req: GenerateFunnelRequest,
  ): Promise<{ funnelId: string; slug: string; pages: number }> {
    const slug = req.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) + '-' + Date.now().toString(36);

    const funnel = await this.createFunnel(organizationId, {
      name: `${req.businessName} — ${req.funnelType} Funnel`,
      description: `AI-generated ${req.funnelType} funnel for ${req.productOrService}`,
      slug,
    });

    const pages = await this.callAIForFunnelPages(req);

    for (const [i, page] of pages.entries()) {
      await this.prisma.funnelPage.create({
        data: {
          funnelId: funnel.id,
          order: i,
          pageType: page.pageType,
          title: page.title,
          slug: page.slug,
          blocksJson: JSON.stringify(page.blocks),
          ctaText: page.ctaText,
          ctaUrl: page.ctaUrl,
          aiGenerated: true,
        },
      });
    }

    await this.prisma.funnel.update({
      where: { id: funnel.id },
      data: { aiGenerated: true },
    });

    this.logger.log(`AI funnel generated: ${funnel.id} with ${pages.length} pages`);
    return { funnelId: funnel.id, slug, pages: pages.length };
  }

  /**
   * Increment page view counter (called by conversion tracking pixel)
   */
  async recordPageView(funnelId: string, pageId: string, visitorId?: string) {
    await this.prisma.funnelPage.update({
      where: { id: pageId },
      data: { views: { increment: 1 } },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.funnelMetrics.upsert({
      where: {
        funnelId_date_pageId: {
          funnelId,
          date: today,
          pageId,
        },
      },
      create: { funnelId, date: today, pageId, views: 1, uniqueVisitors: visitorId ? 1 : 0 },
      update: {
        views: { increment: 1 },
        ...(visitorId ? { uniqueVisitors: { increment: 1 } } : {}),
      },
    });
  }

  /**
   * Increment page conversion counter
   */
  async recordPageConversion(funnelId: string, pageId: string) {
    await this.prisma.funnelPage.update({
      where: { id: pageId },
      data: { conversions: { increment: 1 } },
    });
  }

  /**
   * Get funnel analytics: step-by-step drop-off
   */
  async getFunnelAnalytics(organizationId: string, funnelId: string) {
    const funnel = await this.getFunnel(organizationId, funnelId);

    return {
      funnelId: funnel.id,
      name: funnel.name,
      steps: funnel.pages.map((page) => ({
        pageId: page.id,
        title: page.title,
        pageType: page.pageType,
        order: page.order,
        views: page.views,
        conversions: page.conversions,
        conversionRate: page.views > 0 ? page.conversions / page.views : 0,
      })),
      overallConversionRate:
        funnel.pages.length > 0 && funnel.pages[0].views > 0
          ? (funnel.pages[funnel.pages.length - 1]?.conversions ?? 0) /
            funnel.pages[0].views
          : 0,
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async callAIForFunnelPages(
    req: GenerateFunnelRequest,
  ): Promise<
    Array<{
      pageType: string;
      title: string;
      slug: string;
      blocks: FunnelBlock[];
      ctaText: string;
      ctaUrl: string;
    }>
  > {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      return this.getMockFunnelPages(req);
    }

    const prompt = `
You are an expert conversion-rate optimizer building a high-converting ${req.funnelType} funnel.

BUSINESS: ${req.businessName}
PRODUCT/SERVICE: ${req.productOrService}
TARGET AUDIENCE: ${req.targetAudience}
OBJECTIVE: ${req.objective}
TONE: ${req.tone ?? 'professional'}
${req.pricePoint ? `PRICE POINT: $${req.pricePoint}` : ''}
${req.keyBenefits ? `KEY BENEFITS: ${req.keyBenefits.join(', ')}` : ''}

Generate a complete ${req.funnelType} funnel. For each page, return:
{
  "pageType": "optin|salespage|upsell|thankyou",
  "title": "<page title>",
  "slug": "<url-slug>",
  "ctaText": "<button text>",
  "ctaUrl": "#next",
  "blocks": [
    { "id": "<uuid>", "type": "hero|text|form|cta|testimonial|pricing|countdown", "props": { ... } }
  ]
}

Make blocks realistic with actual copy. Return a JSON array of pages. No markdown.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) throw new Error('AI API error');
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const parsed = JSON.parse(data.choices[0]?.message?.content ?? '[]');
      return Array.isArray(parsed) ? parsed : (parsed.pages ?? this.getMockFunnelPages(req));
    } catch {
      return this.getMockFunnelPages(req);
    }
  }

  private getMockFunnelPages(
    req: GenerateFunnelRequest,
  ): Array<{
    pageType: string;
    title: string;
    slug: string;
    blocks: FunnelBlock[];
    ctaText: string;
    ctaUrl: string;
  }> {
    return [
      {
        pageType: 'optin',
        title: `Get Free Access to ${req.productOrService}`,
        slug: 'optin',
        ctaText: 'Get Instant Access',
        ctaUrl: '/upsell',
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            props: {
              headline: `The Fastest Way to ${req.productOrService}`,
              subheadline: `Join thousands of ${req.targetAudience} already getting results`,
              backgroundImage: null,
            },
          },
          {
            id: 'form-1',
            type: 'form',
            props: {
              fields: ['firstName', 'email'],
              submitText: 'Get Instant Access',
              privacyNote: 'We respect your privacy. No spam.',
            },
          },
        ],
      },
      {
        pageType: 'salespage',
        title: req.productOrService,
        slug: 'offer',
        ctaText: 'Yes, I Want This!',
        ctaUrl: '/checkout',
        blocks: [
          {
            id: 'hero-2',
            type: 'hero',
            props: {
              headline: `Finally — A Better Way to ${req.productOrService}`,
              subheadline: `For ${req.targetAudience} who want results without the frustration`,
            },
          },
          {
            id: 'text-1',
            type: 'text',
            props: {
              content: `${req.keyBenefits?.join(' • ') ?? 'Proven results, expert guidance, and full support.'}`,
            },
          },
          {
            id: 'testimonial-1',
            type: 'testimonial',
            props: {
              quote: `This completely transformed my results. I couldn't believe how fast it worked.`,
              author: 'Sarah M.',
              role: req.targetAudience,
              rating: 5,
            },
          },
          {
            id: 'cta-1',
            type: 'cta',
            props: {
              text: 'Yes, I Want This!',
              subtext: '30-day money-back guarantee',
            },
          },
        ],
      },
      {
        pageType: 'thankyou',
        title: 'Thank You!',
        slug: 'thankyou',
        ctaText: 'Access Your Account',
        ctaUrl: '/dashboard',
        blocks: [
          {
            id: 'hero-3',
            type: 'hero',
            props: {
              headline: 'Welcome to the Family! 🎉',
              subheadline: 'Check your email for next steps.',
            },
          },
        ],
      },
    ];
  }

  private async assertOwnership(organizationId: string, funnelId: string) {
    const f = await this.prisma.funnel.findFirst({
      where: { id: funnelId, organizationId },
      select: { id: true },
    });
    if (!f) throw new NotFoundException('Funnel not found');
  }
}
