import { Injectable } from '@nestjs/common';
import { ActivityType, DealStage } from '@prisma/client';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import { AddActivityDto, CreateDealDto, DealQueryDto, UpdateDealDto } from './dto/deals.dto';

const STAGE_ORDER: DealStage[] = [
  DealStage.PROSPECTING,
  DealStage.QUALIFIED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST,
];

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async createDeal(organizationId: string, userId: string, dto: CreateDealDto) {
    const deal = await this.prisma.deal.create({
      data: {
        organizationId,
        userId,
        title: dto.title,
        contactEmail: dto.contactEmail,
        contactName: dto.contactName,
        companyName: dto.companyName,
        stage: dto.stage ?? DealStage.PROSPECTING,
        priority: dto.priority ?? 'MEDIUM',
        value: dto.value ?? 0,
        currency: dto.currency ?? 'USD',
        probability: dto.probability ?? 20,
        expectedCloseAt: dto.expectedCloseAt ? new Date(dto.expectedCloseAt) : undefined,
        ownerId: dto.ownerId ?? userId,
        pipelineName: dto.pipelineName ?? 'Sales',
        sourceLeadId: dto.sourceLeadId,
        notes: dto.notes,
        tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
        properties: dto.properties ? JSON.stringify(dto.properties) : '',
      },
    });

    await this.logActivity(organizationId, {
      contactEmail: dto.contactEmail ?? '',
      contactName: dto.contactName,
      activityType: 'DEAL_CREATED',
      dealId: deal.id,
      subject: `Deal "${dto.title}" created`,
    });

    return deal;
  }

  async listDeals(organizationId: string, query: DealQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (query.stage) where['stage'] = query.stage;
    if (query.ownerId) where['ownerId'] = query.ownerId;

    const [total, deals] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items: deals, total, page, limit };
  }

  async getDeal(organizationId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return deal;
  }

  async updateDeal(organizationId: string, dealId: string, dto: UpdateDealDto) {
    const current = await this.prisma.deal.findFirst({ where: { id: dealId, organizationId } });

    const updated = await this.prisma.deal.update({
      where: { id: dealId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.stage !== undefined && { stage: dto.stage }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.probability !== undefined && { probability: dto.probability }),
        ...(dto.expectedCloseAt !== undefined && { expectedCloseAt: new Date(dto.expectedCloseAt) }),
        ...(dto.closedAt !== undefined && { closedAt: new Date(dto.closedAt) }),
        ...(dto.lostReason !== undefined && { lostReason: dto.lostReason }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
      },
    });

    if (dto.stage && current?.stage !== dto.stage) {
      await this.logActivity(organizationId, {
        contactEmail: current?.contactEmail ?? '',
        activityType: 'DEAL_STAGE_CHANGED',
        dealId: dealId,
        subject: `Stage changed: ${current?.stage} → ${dto.stage}`,
      });
    }

    return updated;
  }

  async deleteDeal(organizationId: string, dealId: string) {
    await this.prisma.deal.deleteMany({ where: { id: dealId, organizationId } });
    return { deleted: true };
  }

  async getBoardView(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });

    const board: Record<DealStage, typeof deals> = {
      PROSPECTING: [],
      QUALIFIED: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      CLOSED_WON: [],
      CLOSED_LOST: [],
    };

    for (const deal of deals) {
      board[deal.stage].push(deal);
    }

    const totals = STAGE_ORDER.map((stage) => ({
      stage,
      count: board[stage].length,
      value: board[stage].reduce((s, d) => s + d.value, 0),
    }));

    return { board, totals };
  }

  async getContactTimeline(organizationId: string, contactEmail: string) {
    const [activities, deals] = await Promise.all([
      this.prisma.contactActivity.findMany({
        where: { organizationId, contactEmail },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.deal.findMany({
        where: { organizationId, contactEmail },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const totalDealValue = deals.reduce((s, d) => s + d.value, 0);
    const wonValue = deals.filter((d) => d.stage === 'CLOSED_WON').reduce((s, d) => s + d.value, 0);

    return {
      contactEmail,
      summary: {
        totalActivities: activities.length,
        totalDeals: deals.length,
        wonDeals: deals.filter((d) => d.stage === 'CLOSED_WON').length,
        totalDealValue: this.round2(totalDealValue),
        wonDealValue: this.round2(wonValue),
      },
      activities,
      deals,
    };
  }

  async aiScoreDeal(organizationId: string, userId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      include: { activities: { take: 20, orderBy: { createdAt: 'desc' } } },
    });

    if (!deal) return null;

    const prompt = `Score this B2B deal 0-100 (higher = more likely to close). Return JSON: { score: number, reasoning: string, nextBestAction: string }

Deal: ${JSON.stringify({ title: deal.title, stage: deal.stage, value: deal.value, probability: deal.probability, activities: deal.activities.length, company: deal.companyName })}

Only JSON.`;

    let score = deal.probability;
    let reasoning = 'Based on stage and probability.';
    let nextBestAction = 'Follow up with decision maker.';

    try {
      const res = await this.aiService.generateText(
        { prompt, model: AIModel.GPT_4_TURBO, temperature: 0.2, maxTokens: 300 },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );
      const data = this.safeJson(res.text);
      if (data.score) score = Number(data.score);
      if (data.reasoning) reasoning = data.reasoning;
      if (data.nextBestAction) nextBestAction = data.nextBestAction;
    } catch { /* use defaults */ }

    await this.prisma.deal.update({
      where: { id: dealId },
      data: { aiScore: score, aiNotes: `${reasoning} | Next: ${nextBestAction}` },
    });

    return { dealId, score, reasoning, nextBestAction };
  }

  async logActivity(organizationId: string, data: Omit<AddActivityDto, 'metadata'> & { activityType: string }) {
    return this.prisma.contactActivity.create({
      data: {
        organizationId,
        contactEmail: data.contactEmail ?? '',
        contactName: data.contactName,
        activityType: data.activityType as ActivityType,
        dealId: data.dealId,
        subject: data.subject,
        body: data.body,
        performedBy: data.performedBy,
      },
    });
  }

  async addActivity(organizationId: string, dto: AddActivityDto) {
    return this.logActivity(organizationId, dto);
  }

  async getDealStats(organizationId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allDeals, monthDeals] = await Promise.all([
      this.prisma.deal.findMany({ where: { organizationId } }),
      this.prisma.deal.findMany({ where: { organizationId, createdAt: { gte: monthStart } } }),
    ]);

    const pipeline = allDeals.filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
    const won = allDeals.filter((d) => d.stage === 'CLOSED_WON');
    const lost = allDeals.filter((d) => d.stage === 'CLOSED_LOST');

    return {
      total: allDeals.length,
      openDeals: pipeline.length,
      wonDeals: won.length,
      lostDeals: lost.length,
      pipelineValue: this.round2(pipeline.reduce((s, d) => s + d.value, 0)),
      wonValue: this.round2(won.reduce((s, d) => s + d.value, 0)),
      winRate: allDeals.length > 0 ? this.round2((won.length / allDeals.length) * 100) : 0,
      newThisMonth: monthDeals.length,
      avgDealValue: won.length > 0 ? this.round2(won.reduce((s, d) => s + d.value, 0) / won.length) : 0,
    };
  }

  private round2(n: number) { return Math.round(n * 100) / 100; }

  private safeJson(raw: string): Record<string, any> {
    try { return JSON.parse(raw); }
    catch {
      try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
      catch { return {}; }
    }
  }
}
