import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import {
  EnrichLeadDto,
  LeadListQueryDto,
  PredictLeadStrategyDto,
  ScrapeLeadsDto,
  TrackVisitorDto,
} from './dto/lead-engine.dto';

@Injectable()
export class LeadEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async ingestScrapedLeads(organizationId: string, userId: string, dto: ScrapeLeadsDto) {
    const now = new Date();

    const created = await Promise.all(
      dto.prospects.map((prospect) => {
        const leadScore = this.scoreLead(prospect, dto.idealCustomerProfile);

        return this.prisma.analyticsEvent.create({
          data: {
            organizationId,
            userId,
            eventType: 'lead.scraped',
            timestamp: now,
            properties: JSON.stringify({
              campaignName: dto.campaignName,
              source: prospect.source || dto.source || 'unknown',
              leadStatus: 'new',
              leadScore,
              prospect,
              compliance: {
                lawfulBasis: 'legitimate_interest',
                doNotContact: false,
              },
            }),
          },
        });
      }),
    );

    return {
      ingested: created.length,
      averageScore:
        created.length === 0
          ? 0
          : Math.round(
              created
                .map((item) => this.parseProperties(item.properties).leadScore || 0)
                .reduce((a, b) => a + b, 0) / created.length,
            ),
      ids: created.map((item) => item.id),
    };
  }

  async listLeads(organizationId: string, query: LeadListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['lead.scraped', 'lead.enriched'] },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit * 2,
    });

    const mapped = rows
      .map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        ...(this.parseProperties(row.properties) || {}),
      }))
      .filter((row) => {
        const sourceOk = query.source ? row.source === query.source : true;
        const scoreOk = query.minScore !== undefined ? (row.leadScore || 0) >= query.minScore : true;
        const search = query.q?.toLowerCase();
        const qOk = search
          ? JSON.stringify(row).toLowerCase().includes(search)
          : true;
        return sourceOk && scoreOk && qOk;
      })
      .slice(0, limit);

    return {
      items: mapped,
      page,
      limit,
      totalApprox: mapped.length,
    };
  }

  async enrichLead(organizationId: string, userId: string, leadId: string, dto: EnrichLeadDto) {
    const lead = await this.prisma.analyticsEvent.findFirst({
      where: { id: leadId, organizationId, eventType: { in: ['lead.scraped', 'lead.enriched'] } },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    const base = this.parseProperties(lead.properties);
    const prospect = { ...(base.prospect || {}), ...dto };
    const leadScore = this.scoreLead(prospect, base.idealCustomerProfile);

    const updated = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'lead.enriched',
        properties: JSON.stringify({
          ...base,
          source: base.source || 'enrichment',
          leadStatus: 'enriched',
          leadScore,
          prospect,
          parentLeadId: leadId,
          enrichedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      id: updated.id,
      parentLeadId: leadId,
      leadScore,
      prospect,
    };
  }

  async predictLeadStrategy(organizationId: string, userId: string, dto: PredictLeadStrategyDto) {
    const heuristicScore = this.scoreLead(dto as any, dto.idealCustomerProfile);

    const prompt = `You are a SaaS growth strategist. Return strict JSON with keys: conversionProbability, bestChannel, firstTouchAngle, followUpCadence, offerType, risks.
Lead data: ${JSON.stringify(dto)}
Heuristic score: ${heuristicScore}/100
Business context: B2B SaaS lead generation + CRM + automation.
Only return valid JSON.`;

    try {
      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.3,
          maxTokens: 400,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      const parsed = this.safeJson(ai.text);
      return {
        score: heuristicScore,
        ai: parsed,
      };
    } catch {
      return {
        score: heuristicScore,
        ai: {
          conversionProbability: heuristicScore >= 75 ? 'high' : heuristicScore >= 50 ? 'medium' : 'low',
          bestChannel: dto.email ? 'email' : dto.phone ? 'phone' : 'linkedin',
          firstTouchAngle: 'ROI-first outreach with a focused diagnostic offer',
          followUpCadence: ['Day 1 intro', 'Day 3 case study', 'Day 7 CTA with urgency'],
          offerType: 'Free growth audit',
          risks: ['Weak data completeness'],
        },
      };
    }
  }

  async trackVisitor(organizationId: string, userId: string, dto: TrackVisitorDto) {
    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'lead.visitor.tracked',
        properties: JSON.stringify({
          ...dto,
          capturedAt: new Date().toISOString(),
        }),
      },
    });

    return { id: event.id, tracked: true };
  }

  async getLeadStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['lead.scraped', 'lead.enriched', 'lead.visitor.tracked'] },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    const leads = rows.filter((r) => r.eventType === 'lead.scraped' || r.eventType === 'lead.enriched');
    const visitors = rows.filter((r) => r.eventType === 'lead.visitor.tracked').length;
    const avgScore =
      leads.length === 0
        ? 0
        : Math.round(
            leads
              .map((r) => this.parseProperties(r.properties).leadScore || 0)
              .reduce((a, b) => a + b, 0) / leads.length,
          );

    return {
      periodDays: days,
      totals: {
        leads: leads.length,
        visitors,
        averageLeadScore: avgScore,
      },
      bySource: this.countBySource(leads.map((r) => this.parseProperties(r.properties))),
      topLeads: leads
        .map((r) => ({ id: r.id, ...(this.parseProperties(r.properties) || {}) }))
        .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
        .slice(0, 10),
    };
  }

  private scoreLead(prospect: any, icp?: string) {
    let score = 35;
    if (prospect.email) score += 12;
    if (prospect.phone) score += 8;
    if (prospect.linkedinUrl) score += 10;
    if (prospect.website) score += 5;
    if (prospect.companySize && prospect.companySize >= 10 && prospect.companySize <= 1000) score += 12;
    if (prospect.annualRevenue && prospect.annualRevenue > 100000) score += 10;
    if (prospect.industry) score += 8;

    const profileText = `${prospect.industry || ''} ${prospect.companyName || ''}`.toLowerCase();
    if (icp && profileText.includes(icp.toLowerCase())) score += 12;

    return Math.max(0, Math.min(100, score));
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

  private countBySource(rows: any[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const source = row.source || 'unknown';
      map.set(source, (map.get(source) || 0) + 1);
    }
    return Array.from(map.entries()).map(([source, count]) => ({ source, count }));
  }
}
