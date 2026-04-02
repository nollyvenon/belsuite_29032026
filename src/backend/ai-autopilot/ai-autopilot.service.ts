import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import {
  AIAutopilotListQueryDto,
  CreateAutopilotPolicyDto,
  TriggerAutopilotRunDto,
} from './dto/ai-autopilot.dto';
import { AI_AUTOPILOT_QUEUE } from './processors/ai-autopilot.processor';

interface AutopilotPolicy {
  id: string;
  name: string;
  description?: string;
  scope: string;
  pauseRoiThreshold: number;
  scaleRoiThreshold: number;
  scaleBudgetPercent: number;
  autoRun: boolean;
  runCron?: string;
  constraints?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class AIAutopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    @InjectQueue(AI_AUTOPILOT_QUEUE) private readonly queue: Queue,
  ) {}

  async createPolicy(organizationId: string, userId: string, dto: CreateAutopilotPolicyDto) {
    const policy = {
      name: dto.name,
      description: dto.description,
      scope: dto.scope || 'full_stack',
      pauseRoiThreshold: dto.pauseRoiThreshold ?? 0,
      scaleRoiThreshold: dto.scaleRoiThreshold ?? 30,
      scaleBudgetPercent: dto.scaleBudgetPercent ?? 20,
      autoRun: dto.autoRun ?? false,
      runCron: dto.runCron,
      constraints: dto.constraints || {},
      createdAt: new Date().toISOString(),
    };

    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'autopilot.policy.created',
        properties: JSON.stringify(policy),
      },
    });

    return {
      id: event.id,
      ...policy,
    };
  }

  async listPolicies(organizationId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'autopilot.policy.created',
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return events.map((event) => ({
      id: event.id,
      ...this.parse(event.properties),
    }));
  }

  async triggerRun(
    organizationId: string,
    userId: string,
    dto: TriggerAutopilotRunDto,
  ) {
    const run = await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'autopilot.run.requested',
        properties: JSON.stringify({
          policyId: dto.policyId,
          reason: dto.reason || 'manual_trigger',
          context: dto.context || {},
          status: 'queued',
          requestedAt: new Date().toISOString(),
        }),
      },
    });

    await this.queue.add(
      `autopilot-run:${run.id}`,
      {
        type: 'run-policy',
        organizationId,
        userId,
        runId: run.id,
        policyId: dto.policyId,
        reason: dto.reason,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    );

    return {
      runId: run.id,
      status: 'queued',
    };
  }

  async executeRun(
    organizationId: string,
    userId: string,
    runId: string,
    policyId?: string,
    reason?: string,
  ) {
    const policy = await this.resolvePolicy(organizationId, policyId);

    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        dailyBudget: true,
      },
    });

    const perfRows = await this.prisma.campaignPerformance.findMany({
      where: {
        campaign: { organizationId },
      },
      select: {
        campaignId: true,
        spend: true,
        revenue: true,
        date: true,
      },
      orderBy: { date: 'desc' },
      take: 3000,
    });

    const perfMap = new Map<string, { spend: number; revenue: number }>();
    for (const row of perfRows) {
      const current = perfMap.get(row.campaignId) || { spend: 0, revenue: 0 };
      current.spend += row.spend;
      current.revenue += row.revenue;
      perfMap.set(row.campaignId, current);
    }

    const actions: Array<Record<string, unknown>> = [];

    for (const campaign of campaigns) {
      const perf = perfMap.get(campaign.id) || { spend: 0, revenue: 0 };
      const roi = perf.spend > 0 ? ((perf.revenue - perf.spend) / perf.spend) * 100 : 0;

      if (campaign.status === CampaignStatus.ACTIVE && roi < policy.pauseRoiThreshold) {
        await this.prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.PAUSED,
            aiNotes: `Paused by AI Autopilot (ROI ${this.round2(roi)}% below threshold ${policy.pauseRoiThreshold}%).`,
          },
        });

        actions.push({
          type: 'campaign_paused',
          campaignId: campaign.id,
          campaignName: campaign.name,
          roi: this.round2(roi),
          threshold: policy.pauseRoiThreshold,
        });
        continue;
      }

      if (campaign.status === CampaignStatus.ACTIVE && roi >= policy.scaleRoiThreshold) {
        const nextBudget = this.round2((campaign.dailyBudget || 0) * (1 + policy.scaleBudgetPercent / 100));
        await this.prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            dailyBudget: nextBudget,
            aiNotes: `Scaled by AI Autopilot (ROI ${this.round2(roi)}%). Budget +${policy.scaleBudgetPercent}%.`,
          },
        });

        actions.push({
          type: 'campaign_scaled',
          campaignId: campaign.id,
          campaignName: campaign.name,
          roi: this.round2(roi),
          previousBudget: campaign.dailyBudget || 0,
          newBudget: nextBudget,
          scaleBudgetPercent: policy.scaleBudgetPercent,
        });
      }
    }

    const funnelActions = await this.generateFunnelAndMessagingActions(organizationId, userId);
    actions.push(...funnelActions);

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType: 'autopilot.run.completed',
        properties: JSON.stringify({
          runId,
          policyId: policy.id,
          reason: reason || 'scheduled_or_manual',
          actionCount: actions.length,
          actions,
          completedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      runId,
      status: 'completed',
      actions,
    };
  }

  async listRuns(organizationId: string, query: AIAutopilotListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['autopilot.run.requested', 'autopilot.run.completed'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 400,
    });

    const mapped = events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      timestamp: event.timestamp,
      ...this.parse(event.properties),
    }));

    const filtered = mapped.filter((row) => {
      const q = query.q?.toLowerCase();
      return q ? JSON.stringify(row).toLowerCase().includes(q) : true;
    });

    return {
      items: filtered.slice(skip, skip + limit),
      page,
      limit,
      total: filtered.length,
    };
  }

  async getInsights(organizationId: string, userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const [runs, campaigns, perfRows] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          eventType: 'autopilot.run.completed',
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      this.prisma.marketingCampaign.findMany({
        where: { organizationId },
        select: { id: true, name: true, status: true, dailyBudget: true, spentBudget: true },
      }),
      this.prisma.campaignPerformance.findMany({
        where: { campaign: { organizationId }, date: { gte: since } },
        select: { campaignId: true, spend: true, revenue: true, conversions: true },
      }),
    ]);

    const campaignMap = new Map<string, { spend: number; revenue: number; conversions: number }>();
    for (const row of perfRows) {
      const current = campaignMap.get(row.campaignId) || { spend: 0, revenue: 0, conversions: 0 };
      current.spend += row.spend;
      current.revenue += row.revenue;
      current.conversions += row.conversions;
      campaignMap.set(row.campaignId, current);
    }

    const campaignSummary = campaigns.map((c) => {
      const perf = campaignMap.get(c.id) || { spend: 0, revenue: 0, conversions: 0 };
      const roi = perf.spend > 0 ? ((perf.revenue - perf.spend) / perf.spend) * 100 : 0;
      return {
        campaignId: c.id,
        campaignName: c.name,
        status: c.status,
        spend: this.round2(perf.spend),
        revenue: this.round2(perf.revenue),
        conversions: perf.conversions,
        roi: this.round2(roi),
      };
    });

    const prompt = `You are the AI Growth Brain. Analyze autopilot outcomes and return strict JSON with keys: working, notWorking, recommendations.
Autopilot runs: ${JSON.stringify(runs.map((r) => this.parse(r.properties)))}
Campaign performance: ${JSON.stringify(campaignSummary)}
Only JSON.`;

    let ai = {
      working: ['Autopilot executed and applied campaign-level decisions.'],
      notWorking: ['Some campaigns still lack enough conversion signal for confident automation.'],
      recommendations: [
        'Increase event tracking depth for funnel stages.',
        'Run at least daily autopilot cycles for faster optimization loops.',
      ],
    } as Record<string, any>;

    try {
      const res = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.25,
          maxTokens: 500,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      ai = {
        ...ai,
        ...this.safeJson(res.text),
      };
    } catch {
      // fallback already set
    }

    return {
      periodDays: days,
      totals: {
        autopilotRuns: runs.length,
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length,
        pausedCampaigns: campaigns.filter((c) => c.status === CampaignStatus.PAUSED).length,
      },
      campaigns: campaignSummary.sort((a, b) => b.roi - a.roi).slice(0, 10),
      aiInsights: {
        working: Array.isArray(ai.working) ? ai.working : [],
        notWorking: Array.isArray(ai.notWorking) ? ai.notWorking : [],
        recommendations: Array.isArray(ai.recommendations) ? ai.recommendations : [],
      },
    };
  }

  private async resolvePolicy(organizationId: string, policyId?: string): Promise<AutopilotPolicy> {
    if (policyId) {
      const event = await this.prisma.analyticsEvent.findFirst({
        where: {
          id: policyId,
          organizationId,
          eventType: 'autopilot.policy.created',
        },
      });

      if (!event) {
        throw new NotFoundException('Autopilot policy not found');
      }

      return {
        id: event.id,
        ...this.parse(event.properties),
      } as AutopilotPolicy;
    }

    const latest = await this.prisma.analyticsEvent.findFirst({
      where: {
        organizationId,
        eventType: 'autopilot.policy.created',
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      return {
        id: 'default',
        name: 'Default Growth Brain Policy',
        scope: 'full_stack',
        pauseRoiThreshold: 0,
        scaleRoiThreshold: 30,
        scaleBudgetPercent: 20,
        autoRun: false,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: latest.id,
      ...this.parse(latest.properties),
    } as AutopilotPolicy;
  }

  private async generateFunnelAndMessagingActions(organizationId: string, userId: string) {
    const actions: Array<Record<string, unknown>> = [];

    const funnelStats = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['funnel.lead.captured', 'funnel.converted'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 2000,
    });

    const captures = funnelStats.filter((e) => e.eventType === 'funnel.lead.captured').length;
    const conversions = funnelStats.filter((e) => e.eventType === 'funnel.converted').length;
    const conversionRate = captures > 0 ? (conversions / captures) * 100 : 0;

    const messagingStats = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ['marketing.automation.message_sent', 'crm.outreach.message_sent'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 2000,
    });

    if (conversionRate < 3 && captures >= 50) {
      actions.push({
        type: 'funnel_optimization_required',
        reason: `Funnel conversion ${this.round2(conversionRate)}% under 3% baseline`,
        recommendation: 'Reduce form friction and strengthen CTA on first step.',
      });
    }

    if (messagingStats.length >= 100) {
      actions.push({
        type: 'messaging_experiment_suggested',
        reason: 'Sufficient outreach volume detected for A/B copy auto-rotation.',
        recommendation: 'Rotate value-prop-first variant to 60% allocation for next cycle.',
      });
    }

    if (actions.length > 0) {
      await this.prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          eventType: 'autopilot.optimization.suggestions',
          properties: JSON.stringify({
            actions,
            generatedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return actions;
  }

  private parse(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private safeJson(raw: string): Record<string, any> {
    try {
      return JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        return {};
      }
    }
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }
}
