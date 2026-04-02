import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { AIModel } from '../../ai/types/ai.types';
import { PrismaService } from '../../database/prisma.service';

interface CampaignPerformanceInsight {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  roas: number;
  roi: number;
}

interface ChannelPerformanceInsight {
  channel: string;
  revenue: number;
  conversions: number;
  share: number;
}

interface ChurnRiskItem {
  segment: string;
  riskScore: number;
  reason: string;
  recommendedAction: string;
}

@Injectable()
export class AnalyticsIntelligenceService {
  private readonly logger = new Logger(AnalyticsIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async getIntelligence(organizationId: string, userId: string, days = 30) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const [campaignPerfRows, conversionRows, subs, payments] = await Promise.all([
      this.prisma.campaignPerformance.findMany({
        where: { campaign: { organizationId }, date: { gte: since } },
        select: {
          campaignId: true,
          impressions: true,
          clicks: true,
          conversions: true,
          spend: true,
          revenue: true,
          campaign: { select: { name: true } },
        },
      }),
      this.prisma.conversionEvent.findMany({
        where: { organizationId, occurredAt: { gte: since } },
        select: {
          eventType: true,
          value: true,
          utmSource: true,
          occurredAt: true,
        },
      }),
      this.prisma.subscription.findMany({
        where: { organizationId },
        select: { status: true, currentPeriodEnd: true, cancelledAt: true, updatedAt: true },
      }),
      this.prisma.payment.findMany({
        where: {
          subscription: { organizationId },
          OR: [{ paidAt: { gte: since } }, { createdAt: { gte: since } }],
          status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'] },
        },
        select: { amount: true, refundedAmount: true, status: true, createdAt: true, paidAt: true },
      }),
    ]);

    const campaignPerformance = this.buildCampaignPerformance(campaignPerfRows);
    const channelPerformance = this.buildChannelPerformance(conversionRows);
    const leadConversion = this.buildLeadConversion(conversionRows);
    const roi = this.buildROI(campaignPerformance, payments);
    const churnPrediction = this.buildChurnPrediction(subs, conversionRows, payments, days);

    const heuristic = this.buildHeuristicNarrative({ campaignPerformance, channelPerformance, leadConversion, roi, churnPrediction });

    let aiNarrative = heuristic;
    try {
      const prompt = [
        'You are a SaaS data intelligence strategist.',
        'Return strict JSON only with keys: working, notWorking, recommendations, churn.',
        'working/notWorking/recommendations must be arrays of short strings (max 6 items each).',
        'churn must be array of {segment, riskScore, reason, recommendedAction}.',
        `Campaign performance: ${JSON.stringify(campaignPerformance.slice(0, 8))}`,
        `ROI: ${JSON.stringify(roi)}`,
        `Lead conversion: ${JSON.stringify(leadConversion)}`,
        `Channel performance: ${JSON.stringify(channelPerformance)}`,
        `Heuristic churn: ${JSON.stringify(churnPrediction)}`,
      ].join('\n');

      const ai = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.25,
          maxTokens: 800,
        },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );

      const parsed = this.safeJson(ai.text);
      aiNarrative = {
        working: Array.isArray(parsed.working) ? parsed.working.slice(0, 6) : heuristic.working,
        notWorking: Array.isArray(parsed.notWorking) ? parsed.notWorking.slice(0, 6) : heuristic.notWorking,
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 6)
          : heuristic.recommendations,
        churn: Array.isArray(parsed.churn)
          ? parsed.churn.slice(0, 5)
          : heuristic.churn,
      };
    } catch (err) {
      this.logger.warn(`Falling back to heuristic intelligence: ${(err as Error).message}`);
    }

    return {
      periodDays: days,
      campaignPerformance,
      roi,
      leadConversion,
      channelPerformance,
      aiInsights: aiNarrative,
    };
  }

  private buildCampaignPerformance(rows: Array<{
    campaignId: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    campaign: { name: string };
  }>): CampaignPerformanceInsight[] {
    const map = new Map<string, CampaignPerformanceInsight>();

    for (const row of rows) {
      const existing = map.get(row.campaignId) || {
        campaignId: row.campaignId,
        campaignName: row.campaign?.name || 'Unnamed campaign',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
        roas: 0,
        roi: 0,
      };

      existing.impressions += row.impressions;
      existing.clicks += row.clicks;
      existing.conversions += row.conversions;
      existing.spend += row.spend;
      existing.revenue += row.revenue;
      map.set(row.campaignId, existing);
    }

    return Array.from(map.values())
      .map((item) => {
        const ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
        const cvr = item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0;
        const roas = item.spend > 0 ? item.revenue / item.spend : 0;
        const roi = item.spend > 0 ? ((item.revenue - item.spend) / item.spend) * 100 : 0;
        return {
          ...item,
          spend: this.round2(item.spend),
          revenue: this.round2(item.revenue),
          ctr: this.round2(ctr),
          cvr: this.round2(cvr),
          roas: this.round2(roas),
          roi: this.round2(roi),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private buildROI(campaigns: CampaignPerformanceInsight[], payments: Array<{
    amount: number;
    refundedAmount: number;
    status: string;
  }>) {
    const spend = campaigns.reduce((sum, item) => sum + item.spend, 0);
    const campaignRevenue = campaigns.reduce((sum, item) => sum + item.revenue, 0);

    const collectedRevenue = payments
      .filter((p) => p.status === 'COMPLETED' || p.status === 'PARTIALLY_REFUNDED' || p.status === 'REFUNDED')
      .reduce((sum, p) => sum + Math.max(p.amount - p.refundedAmount, 0), 0);

    const netROI = spend > 0 ? ((campaignRevenue - spend) / spend) * 100 : 0;

    return {
      spend: this.round2(spend),
      campaignRevenue: this.round2(campaignRevenue),
      collectedRevenue: this.round2(collectedRevenue),
      netROI: this.round2(netROI),
      paybackSignal: netROI >= 30 ? 'strong' : netROI >= 5 ? 'moderate' : 'weak',
    };
  }

  private buildLeadConversion(rows: Array<{ eventType: string; value: number | null }>) {
    const leadEvents = rows.filter((r) => r.eventType === 'FORM_SUBMIT' || r.eventType === 'SIGNUP').length;
    const purchaseEvents = rows.filter((r) => r.eventType === 'PURCHASE').length;
    const leadToCustomerRate = leadEvents > 0 ? (purchaseEvents / leadEvents) * 100 : 0;

    return {
      leads: leadEvents,
      customers: purchaseEvents,
      leadToCustomerRate: this.round2(leadToCustomerRate),
    };
  }

  private buildChannelPerformance(rows: Array<{ utmSource: string | null; value: number | null; eventType: string }>): ChannelPerformanceInsight[] {
    const map = new Map<string, { revenue: number; conversions: number }>();

    for (const row of rows) {
      const channel = row.utmSource || 'DIRECT';
      const entry = map.get(channel) || { revenue: 0, conversions: 0 };
      entry.revenue += row.value || 0;
      if (row.eventType === 'PURCHASE' || row.eventType === 'SIGNUP') {
        entry.conversions += 1;
      }
      map.set(channel, entry);
    }

    const totalRevenue = Array.from(map.values()).reduce((sum, row) => sum + row.revenue, 0);

    return Array.from(map.entries())
      .map(([channel, row]) => ({
        channel,
        revenue: this.round2(row.revenue),
        conversions: row.conversions,
        share: totalRevenue > 0 ? this.round2((row.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }

  private buildChurnPrediction(
    subs: Array<{ status: string; currentPeriodEnd: Date; cancelledAt: Date | null; updatedAt: Date }>,
    conversionRows: Array<{ occurredAt: Date; eventType: string }>,
    payments: Array<{ status: string; createdAt: Date; paidAt: Date | null; amount: number; refundedAmount: number }>,
    days: number,
  ): ChurnRiskItem[] {
    const active = subs.filter((s) => s.status === 'ACTIVE').length;
    const pastDue = subs.filter((s) => s.status === 'PAST_DUE').length;
    const cancelled = subs.filter((s) => s.status === 'CANCELLED').length;

    const windowMid = new Date();
    windowMid.setDate(windowMid.getDate() - Math.floor(days / 2));

    const firstHalfConversions = conversionRows.filter((r) => r.occurredAt < windowMid && (r.eventType === 'PURCHASE' || r.eventType === 'SIGNUP')).length;
    const secondHalfConversions = conversionRows.filter((r) => r.occurredAt >= windowMid && (r.eventType === 'PURCHASE' || r.eventType === 'SIGNUP')).length;

    const firstHalfRevenue = payments
      .filter((p) => (p.paidAt || p.createdAt) < windowMid)
      .reduce((sum, p) => sum + Math.max(p.amount - p.refundedAmount, 0), 0);
    const secondHalfRevenue = payments
      .filter((p) => (p.paidAt || p.createdAt) >= windowMid)
      .reduce((sum, p) => sum + Math.max(p.amount - p.refundedAmount, 0), 0);

    const conversionDecline = firstHalfConversions > 0
      ? ((firstHalfConversions - secondHalfConversions) / firstHalfConversions) * 100
      : 0;
    const revenueDecline = firstHalfRevenue > 0
      ? ((firstHalfRevenue - secondHalfRevenue) / firstHalfRevenue) * 100
      : 0;

    const items: ChurnRiskItem[] = [];

    const billingRiskScore = Math.min(100, Math.round((pastDue * 12 + cancelled * 7) / Math.max(active + pastDue + cancelled, 1) * 100));
    items.push({
      segment: 'billing_health',
      riskScore: billingRiskScore,
      reason: `${pastDue} past-due and ${cancelled} cancelled subscriptions in current population.`,
      recommendedAction: 'Trigger dunning emails + account-manager outreach for high-ARPU accounts.',
    });

    const usageRisk = Math.min(100, Math.max(0, Math.round((conversionDecline + revenueDecline) / 2)));
    items.push({
      segment: 'engagement_revenue_trend',
      riskScore: usageRisk,
      reason: `Conversion decline ${this.round2(conversionDecline)}% and revenue decline ${this.round2(revenueDecline)}% between half-period windows.`,
      recommendedAction: 'Launch win-back offers and in-app activation nudges to at-risk cohorts.',
    });

    return items.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  }

  private buildHeuristicNarrative(data: {
    campaignPerformance: CampaignPerformanceInsight[];
    channelPerformance: ChannelPerformanceInsight[];
    leadConversion: { leads: number; customers: number; leadToCustomerRate: number };
    roi: { netROI: number; paybackSignal: string };
    churnPrediction: ChurnRiskItem[];
  }) {
    const topCampaign = data.campaignPerformance[0];
    const weakCampaign = [...data.campaignPerformance].sort((a, b) => a.roi - b.roi)[0];
    const topChannel = data.channelPerformance[0];

    const working: string[] = [];
    const notWorking: string[] = [];
    const recommendations: string[] = [];

    if (topCampaign && topCampaign.roi > 20) {
      working.push(`${topCampaign.campaignName} has strong ROI (${topCampaign.roi}%) and should be scaled.`);
    }
    if (topChannel && topChannel.share > 40) {
      working.push(`${topChannel.channel} drives ${topChannel.share}% of channel revenue.`);
    }
    if (data.leadConversion.leadToCustomerRate >= 10) {
      working.push(`Lead-to-customer conversion is healthy at ${data.leadConversion.leadToCustomerRate}%.`);
    }

    if (weakCampaign && weakCampaign.roi < 0) {
      notWorking.push(`${weakCampaign.campaignName} is unprofitable (${weakCampaign.roi}% ROI).`);
    }
    if (data.leadConversion.leadToCustomerRate < 5) {
      notWorking.push(`Lead conversion rate is low at ${data.leadConversion.leadToCustomerRate}%.`);
    }
    if (data.roi.netROI < 10) {
      notWorking.push(`Overall marketing ROI is weak (${data.roi.netROI}%).`);
    }

    recommendations.push('Reallocate spend toward top-ROI campaigns and pause underperformers for 7-day test cycles.');
    recommendations.push('Improve lead qualification forms and nurture flows to lift lead-to-customer conversion.');
    recommendations.push('Run channel-level creative tests where revenue share is high but conversion is flattening.');

    return {
      working: working.slice(0, 6),
      notWorking: notWorking.slice(0, 6),
      recommendations: recommendations.slice(0, 6),
      churn: data.churnPrediction,
    };
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
