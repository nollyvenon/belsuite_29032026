import { Injectable } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import { BulkTrackKeywordsDto, KeywordResearchDto, RankQueryDto, TrackKeywordDto } from './dto/rank-tracker.dto';

@Injectable()
export class RankTrackerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async trackKeyword(organizationId: string, dto: TrackKeywordDto) {
    return this.prisma.keywordRank.create({
      data: {
        organizationId,
        keyword: dto.keyword.toLowerCase().trim(),
        domain: dto.domain.toLowerCase().trim(),
        country: dto.country ?? 'us',
        device: dto.device ?? 'desktop',
        searchVolume: dto.searchVolume,
        difficulty: dto.difficulty,
        trackedAt: new Date(),
      },
    });
  }

  async bulkTrack(organizationId: string, dto: BulkTrackKeywordsDto) {
    const rows = (dto.keywords || []).map((kw: string) => ({
      organizationId,
      keyword: kw.toLowerCase().trim(),
      domain: dto.domain.toLowerCase().trim(),
      country: dto.country ?? 'us',
      device: 'desktop',
      trackedAt: new Date(),
    }));

    await this.prisma.keywordRank.createMany({ data: rows });
    return { tracked: rows.length };
  }

  async listRanks(organizationId: string, query: RankQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (query.domain) where['domain'] = query.domain;
    if (query.keyword) where['keyword'] = { contains: query.keyword };

    const [total, ranks] = await Promise.all([
      this.prisma.keywordRank.count({ where }),
      this.prisma.keywordRank.findMany({
        where,
        orderBy: { trackedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Build movement map (current vs previous entry per keyword)
    const grouped = new Map<string, typeof ranks[0][]>();
    for (const r of ranks) {
      const key = `${r.domain}::${r.keyword}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }

    const richRanks = ranks.map((r) => {
      const key = `${r.domain}::${r.keyword}`;
      const history = grouped.get(key) ?? [];
      const prev = history[1];
      const movement = r.position && prev?.position ? prev.position - r.position : 0;
      return { ...r, movement };
    });

    return { items: richRanks, total, page, limit };
  }

  async getKeywordHistory(organizationId: string, keyword: string, domain: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await this.prisma.keywordRank.findMany({
      where: { organizationId, keyword: keyword.toLowerCase(), domain: domain.toLowerCase(), trackedAt: { gte: since } },
      orderBy: { trackedAt: 'asc' },
    });

    return history;
  }

  async aiResearch(organizationId: string, userId: string, dto: KeywordResearchDto) {
    const prompt = `You are an SEO expert. Generate ${dto.count ?? 20} long-tail keyword variations for the seed keyword "${dto.seedKeyword}"${dto.industry ? ` in the ${dto.industry} industry` : ''}${dto.country ? ` targeting ${dto.country}` : ''}.

For each keyword return a JSON object with: { keyword, searchVolume (number estimate), difficulty (0-100), intent ("informational"|"commercial"|"transactional"), suggestedUrl }

Return a JSON array only.`;

    let keywords: Array<Record<string, unknown>> = [];

    try {
      const res = await this.aiService.generateText(
        { prompt, model: AIModel.GPT_4_TURBO, temperature: 0.3, maxTokens: 1200 },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );
      const parsed = this.safeJsonArray(res.text);
      keywords = parsed;
    } catch {
      keywords = [
        { keyword: dto.seedKeyword, searchVolume: 1000, difficulty: 40, intent: 'informational' },
      ];
    }

    return { seedKeyword: dto.seedKeyword, suggestions: keywords, count: keywords.length };
  }

  async getStats(organizationId: string) {
    const all = await this.prisma.keywordRank.findMany({
      where: { organizationId },
      orderBy: { trackedAt: 'desc' },
      take: 5000,
    });

    const uniqueKeywords = new Set(all.map((r) => r.keyword)).size;
    const uniqueDomains = new Set(all.map((r) => r.domain)).size;
    const top10 = all.filter((r) => r.position && r.position <= 10).length;
    const top3 = all.filter((r) => r.position && r.position <= 3).length;
    const avgPos = all.filter((r) => r.position).length > 0
      ? all.filter((r) => r.position).reduce((s, r) => s + (r.position ?? 0), 0) / all.filter((r) => r.position).length
      : null;

    return {
      totalTrackedEntries: all.length,
      uniqueKeywords,
      uniqueDomains,
      top10Rankings: top10,
      top3Rankings: top3,
      avgPosition: avgPos ? Math.round(avgPos * 10) / 10 : null,
    };
  }

  private safeJsonArray(raw: string): Array<Record<string, unknown>> {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
  }
}
