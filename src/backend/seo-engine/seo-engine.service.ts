import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { ContentGenerationService } from '../ai/services/content-generation.service';
import { AIModel } from '../ai/types/ai.types';
import {
  BacklinkQueryDto,
  CompetitorBacklinkAnalysisDto,
  GenerateSeoContentDto,
  KeywordClusterDto,
  OutreachEmailDto,
  TrackBacklinkDto,
} from './dto/seo-engine.dto';

@Injectable()
export class SeoEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly contentGenerationService: ContentGenerationService,
  ) {}

  async generateSeoContent(organizationId: string, userId: string, dto: GenerateSeoContentDto) {
    const keywords = [dto.primaryKeyword, ...(dto.secondaryKeywords || [])].filter(Boolean).join(', ');

    const blog = await this.contentGenerationService.generateBlogPost(organizationId, userId, {
      topic: dto.topic,
      audience: dto.targetAudience || 'buyers with commercial intent',
      tone: dto.tone || 'professional',
      wordCount: dto.wordCount || 1800,
      keywords,
    });

    const slug = this.slugify(dto.topic);
    const created = await this.prisma.content.create({
      data: {
        organizationId,
        creatorId: userId,
        type: 'TEXT',
        title: dto.topic,
        slug: `${slug}-${Date.now()}`,
        description: `SEO article generated for keyword strategy: ${keywords}`,
        content: blog.content,
        status: 'DRAFT',
        tags: ['seo', 'backlink-ready', ...(dto.secondaryKeywords || [])],
      },
    });

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        contentId: created.id,
        eventType: 'seo.content.generated',
        properties: JSON.stringify({
          primaryKeyword: dto.primaryKeyword,
          secondaryKeywords: dto.secondaryKeywords || [],
          wordCount: dto.wordCount || 1800,
        }),
      },
    });

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      status: created.status,
      metadata: blog.metadata,
    };
  }

  async trackBacklink(organizationId: string, userId: string, dto: TrackBacklinkDto) {
    const quality = dto.qualityScore ?? this.computeBacklinkQuality(dto);

    const row = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'seo.backlink.created',
        properties: JSON.stringify({
          ...dto,
          qualityScore: quality,
          trackedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      id: row.id,
      qualityScore: quality,
      domainAuthorityImpact: this.estimateAuthorityImpact(quality, dto.sourceDomainAuthority || 0),
    };
  }

  async listBacklinks(organizationId: string, query: BacklinkQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'seo.backlink.created',
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    const items = rows
      .map((r) => ({ id: r.id, timestamp: r.timestamp, ...this.parseProperties(r.properties) }))
      .filter((item) => (query.linkType ? item.linkType === query.linkType : true));

    return {
      items,
      page,
      limit,
      totalApprox: items.length,
    };
  }

  async analyzeCompetitorBacklinks(
    organizationId: string,
    userId: string,
    dto: CompetitorBacklinkAnalysisDto,
  ) {
    const prompt = `Act as a technical SEO strategist. Analyze competitor domains and return strict JSON with keys: highValueLinkTargets, outreachAngles, anchorTextPlan, quickWins, riskChecks.
Competitors: ${dto.competitorDomains.join(', ')}
Target keywords: ${(dto.targetKeywords || []).join(', ')}
Only return JSON.`;

    const ai = await this.aiService.generateText(
      {
        prompt,
        model: AIModel.GPT_4_TURBO,
        temperature: 0.4,
        maxTokens: 800,
      },
      organizationId,
      userId,
      { type: 'best_quality' },
      true,
    );

    return this.safeJson(ai.text);
  }

  async generateKeywordClusters(organizationId: string, userId: string, dto: KeywordClusterDto) {
    const prompt = `Cluster these keywords by search intent for SaaS growth. Return strict JSON array under key clusters where each cluster has: name, intent, keywords, pillarTopic, internalLinkSuggestions.
Keywords: ${dto.keywords.join(', ')}
Context: ${dto.businessContext || 'B2B SaaS'}
Only return JSON.`;

    const ai = await this.aiService.generateText(
      {
        prompt,
        model: AIModel.GPT_4_TURBO,
        temperature: 0.3,
        maxTokens: 700,
      },
      organizationId,
      userId,
      { type: 'best_quality' },
      true,
    );

    return this.safeJson(ai.text);
  }

  async generateOutreachEmail(organizationId: string, userId: string, dto: OutreachEmailDto) {
    const prompt = `Write a backlink outreach email and anchor text plan. Return strict JSON with keys: subject, emailBody, anchorTextOptions, followUp1, followUp2.
Target site: ${dto.targetSite}
Offer: ${dto.yourOffer}
Target keyword: ${dto.targetKeyword || 'N/A'}
Tone: ${dto.tone || 'professional'}
Only return JSON.`;

    const ai = await this.aiService.generateText(
      {
        prompt,
        model: AIModel.GPT_4_TURBO,
        temperature: 0.6,
        maxTokens: 700,
      },
      organizationId,
      userId,
      { type: 'cheapest' },
      true,
    );

    return this.safeJson(ai.text);
  }

  async getSeoStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const [contentCount, backlinks] = await Promise.all([
      this.prisma.content.count({
        where: {
          organizationId,
          tags: { has: 'seo' },
          createdAt: { gte: since },
        },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          eventType: 'seo.backlink.created',
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      }),
    ]);

    const backlinkRows = backlinks.map((r) => this.parseProperties(r.properties));
    const avgQuality =
      backlinkRows.length === 0
        ? 0
        : Math.round(
            backlinkRows
              .map((b) => b.qualityScore || 0)
              .reduce((a, b) => a + b, 0) / backlinkRows.length,
          );

    return {
      periodDays: days,
      totals: {
        seoContentPieces: contentCount,
        backlinks: backlinkRows.length,
        averageBacklinkQuality: avgQuality,
      },
      estimatedDomainAuthority: this.computeDomainAuthority(backlinkRows),
      byLinkType: this.countByLinkType(backlinkRows),
    };
  }

  private computeBacklinkQuality(dto: TrackBacklinkDto) {
    let score = 45;
    if (dto.anchorText) score += 10;
    if (dto.sourceDomainAuthority) score += Math.min(30, Math.round(dto.sourceDomainAuthority / 2));
    if ((dto.linkType || 'editorial') === 'editorial') score += 10;
    if ((dto.linkType || '') === 'guest_post') score += 7;
    return Math.max(0, Math.min(100, score));
  }

  private estimateAuthorityImpact(quality: number, sourceDa: number) {
    return Number(((quality * 0.5 + sourceDa * 0.5) / 100).toFixed(2));
  }

  private computeDomainAuthority(backlinks: any[]) {
    if (backlinks.length === 0) return 10;
    const weighted = backlinks.map((b) => (b.qualityScore || 0) * ((b.sourceDomainAuthority || 20) / 100));
    const avg = weighted.reduce((a, b) => a + b, 0) / backlinks.length;
    return Math.max(10, Math.min(90, Math.round(avg)));
  }

  private parseProperties(raw?: string | null) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private safeJson(raw: string) {
    try {
      return JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        return { raw };
      }
    }
  }

  private countByLinkType(backlinks: any[]) {
    const map = new Map<string, number>();
    for (const row of backlinks) {
      const key = row.linkType || 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([linkType, count]) => ({ linkType, count }));
  }

  private slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
