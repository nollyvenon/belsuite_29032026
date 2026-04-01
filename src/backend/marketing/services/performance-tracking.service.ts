/**
 * Performance Tracking Service
 * Aggregates campaign metrics, provides dashboard overview,
 * and ingests daily performance data from ad platforms.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  DashboardOverview,
  CampaignSummary,
  TopAd,
  RecentConversion,
} from '../marketing.types';

@Injectable()
export class PerformanceTrackingService {
  private readonly logger = new Logger(PerformanceTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Full dashboard overview: spend, revenue, conversions, active campaigns
   */
  async getDashboardOverview(
    organizationId: string,
    days = 30,
  ): Promise<DashboardOverview> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [snapshots, adPerf, recentConversions, activeCampaigns] =
      await Promise.all([
        this.prisma.campaignPerformance.findMany({
          where: {
            campaign: { organizationId },
            date: { gte: since },
          },
          include: { campaign: { select: { name: true, status: true } } },
        }),
        this.prisma.adPerformance.findMany({
          where: {
            ad: { campaign: { organizationId } },
            date: { gte: since },
          },
          include: {
            ad: {
              select: { id: true, name: true, campaign: { select: { name: true } } },
            },
          },
        }),
        this.prisma.conversionEvent.findMany({
          where: { organizationId, occurredAt: { gte: since } },
          orderBy: { occurredAt: 'desc' },
          take: 10,
          select: {
            id: true,
            eventType: true,
            value: true,
            occurredAt: true,
            utmCampaign: true,
          },
        }),
        this.prisma.marketingCampaign.count({
          where: { organizationId, status: 'ACTIVE' },
        }),
      ]);

    // Aggregate campaign-level totals
    const campaignMap = new Map<
      string,
      {
        campaignId: string;
        name: string;
        status: string;
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        revenue: number;
      }
    >();

    for (const s of snapshots) {
      const key = s.campaignId;
      const existing = campaignMap.get(key) ?? {
        campaignId: s.campaignId,
        name: s.campaign.name,
        status: s.campaign.status,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };
      existing.impressions += s.impressions;
      existing.clicks += s.clicks;
      existing.conversions += s.conversions;
      existing.spend += s.spend;
      existing.revenue += s.revenue;
      campaignMap.set(key, existing);
    }

    const campaigns: CampaignSummary[] = Array.from(campaignMap.values()).map((c) => {
      const ctr = c.impressions > 0 ? c.clicks / c.impressions : 0;
      const cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
      const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
      const roas = c.spend > 0 ? c.revenue / c.spend : 0;

      return {
        ...c,
        ctr,
        cpc,
        cpa,
        roas,
        trend: 'stable' as const,
        trendPct: 0,
      };
    });

    // Aggregate ad-level top performers
    const adMap = new Map<
      string,
      {
        adId: string;
        adName: string;
        campaignName: string;
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        revenue: number;
      }
    >();

    for (const p of adPerf) {
      const key = p.adId;
      const existing = adMap.get(key) ?? {
        adId: p.adId,
        adName: p.ad.name,
        campaignName: p.ad.campaign.name,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };
      existing.impressions += p.impressions;
      existing.clicks += p.clicks;
      existing.conversions += p.conversions;
      existing.spend += p.spend;
      existing.revenue += p.revenue;
      adMap.set(key, existing);
    }

    const topAds: TopAd[] = Array.from(adMap.values())
      .map((a) => ({
        adId: a.adId,
        adName: a.adName,
        campaignName: a.campaignName,
        ctr: a.impressions > 0 ? a.clicks / a.impressions : 0,
        cvr: a.clicks > 0 ? a.conversions / a.clicks : 0,
        roas: a.spend > 0 ? a.revenue / a.spend : 0,
      }))
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);

    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        revenue: acc.revenue + c.revenue,
        conversions: acc.conversions + c.conversions,
        impressions: acc.impressions + c.impressions,
      }),
      { spend: 0, revenue: 0, conversions: 0, impressions: 0 },
    );

    // Spend by platform from platform breakdown JSON
    const spendByPlatform = this.aggregateSpendByPlatform(snapshots);

    return {
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      totalConversions: totals.conversions,
      totalImpressions: totals.impressions,
      avgROAS: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      activeCampaigns,
      campaigns,
      topAds,
      recentConversions: recentConversions.map((c): RecentConversion => ({
        id: c.id,
        eventType: c.eventType,
        value: c.value,
        occurredAt: c.occurredAt.toISOString(),
        utmCampaign: c.utmCampaign,
      })),
      spendByPlatform,
    };
  }

  /**
   * Campaign performance chart data
   */
  async getCampaignChart(
    organizationId: string,
    campaignId: string,
    days = 30,
  ) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: { id: true, name: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await this.prisma.campaignPerformance.findMany({
      where: { campaignId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    return {
      campaignId,
      name: campaign.name,
      data: snapshots.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        impressions: s.impressions,
        clicks: s.clicks,
        conversions: s.conversions,
        spend: s.spend,
        revenue: s.revenue,
        ctr: s.ctr,
        cpc: s.cpc,
        cpa: s.cpa,
        roas: s.roas,
      })),
    };
  }

  async getCampaignROI(
    organizationId: string,
    campaignId: string,
    days = 30,
  ) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: {
        id: true,
        name: true,
        objective: true,
        dailyBudget: true,
        totalBudget: true,
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [snapshots, conversions] = await Promise.all([
      this.prisma.campaignPerformance.findMany({
        where: { campaignId, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.conversionEvent.findMany({
        where: {
          organizationId,
          utmCampaign: campaign.name,
          occurredAt: { gte: since },
        },
        select: { value: true },
      }),
    ]);

    const totals = snapshots.reduce(
      (acc, snapshot) => ({
        spend: acc.spend + snapshot.spend,
        revenue: acc.revenue + snapshot.revenue,
        clicks: acc.clicks + snapshot.clicks,
        impressions: acc.impressions + snapshot.impressions,
        conversions: acc.conversions + snapshot.conversions,
      }),
      { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 },
    );

    const attributedRevenue = Math.max(
      totals.revenue,
      conversions.reduce((sum, conversion) => sum + (conversion.value ?? 0), 0),
    );
    const roas = totals.spend > 0 ? attributedRevenue / totals.spend : 0;
    const roi = totals.spend > 0 ? ((attributedRevenue - totals.spend) / totals.spend) * 100 : 0;

    return {
      campaignId: campaign.id,
      name: campaign.name,
      objective: campaign.objective,
      dateRangeDays: days,
      totals: {
        spend: totals.spend,
        revenue: attributedRevenue,
        clicks: totals.clicks,
        impressions: totals.impressions,
        conversions: totals.conversions,
      },
      efficiency: {
        ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
        cvr: totals.clicks > 0 ? totals.conversions / totals.clicks : 0,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas,
        roi,
      },
      budget: {
        dailyBudget: campaign.dailyBudget,
        totalBudget: campaign.totalBudget,
      },
      recommendations: this.buildROIRecommendations(roas, roi, totals.conversions),
    };
  }

  /**
   * Ingest daily performance snapshot from a platform sync.
   * Called by platform adapters (Facebook Ads, Google Ads) after pulling metrics.
   */
  async ingestDailySnapshot(
    campaignId: string,
    date: Date,
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
      platformBreakdown?: string;
    },
  ) {
    const impressions = metrics.impressions;
    const clicks = metrics.clicks;
    const conversions = metrics.conversions;
    const spend = metrics.spend;
    const revenue = metrics.revenue;

    await this.prisma.campaignPerformance.upsert({
      where: { campaignId_date: { campaignId, date } },
      create: {
        campaignId,
        date,
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr: impressions > 0 ? clicks / impressions : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? revenue / spend : 0,
        platformBreakdown: metrics.platformBreakdown,
      },
      update: {
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr: impressions > 0 ? clicks / impressions : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? revenue / spend : 0,
        platformBreakdown: metrics.platformBreakdown,
      },
    });

    // Also update campaign spentBudget
    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { spentBudget: { increment: spend } },
    });
  }

  /**
   * Ingest per-ad performance
   */
  async ingestAdSnapshot(
    adId: string,
    date: Date,
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
      frequency?: number;
    },
  ) {
    await this.prisma.adPerformance.upsert({
      where: { adId_date: { adId, date } },
      create: { adId, date, ...metrics },
      update: metrics,
    });
  }

  // ─── Conversion tracking ─────────────────────────────────────────────────────

  /**
   * Record a conversion event (called from frontend pixel or webhook)
   */
  async recordConversion(
    organizationId: string,
    data: {
      eventType: string;
      eventName?: string;
      adId?: string;
      funnelPageId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
      clickId?: string;
      sessionId?: string;
      visitorId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      pageUrl?: string;
      value?: number;
      currency?: string;
      metadataJson?: string;
    },
  ) {
    return this.prisma.conversionEvent.create({
      data: {
        organizationId,
        eventType: data.eventType as any,
        eventName: data.eventName,
        adId: data.adId,
        funnelPageId: data.funnelPageId,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        utmTerm: data.utmTerm,
        clickId: data.clickId,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
        pageUrl: data.pageUrl,
        value: data.value,
        currency: data.currency ?? 'USD',
        metadataJson: data.metadataJson,
      },
    });
  }

  /**
   * Get conversion funnel analytics: page-by-page conversion rates
   */
  async getConversionFunnel(
    organizationId: string,
    utmCampaign?: string,
    days = 30,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = { organizationId, occurredAt: { gte: since } };
    if (utmCampaign) where.utmCampaign = utmCampaign;

    const events = await this.prisma.conversionEvent.groupBy({
      by: ['eventType'],
      where,
      _count: { id: true },
      _sum: { value: true },
    });

    return events.map((e) => ({
      eventType: e.eventType,
      count: e._count.id,
      totalValue: e._sum.value ?? 0,
    }));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private aggregateSpendByPlatform(snapshots: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const s of snapshots) {
      if (!s.platformBreakdown) continue;
      try {
        const breakdown = JSON.parse(s.platformBreakdown);
        for (const [platform, data] of Object.entries(breakdown)) {
          const spend = (data as any).spend ?? 0;
          result[platform] = (result[platform] ?? 0) + spend;
        }
      } catch {
        // ignore malformed JSON
      }
    }
    return result;
  }

  private buildROIRecommendations(
    roas: number,
    roi: number,
    conversions: number,
  ): string[] {
    const recommendations: string[] = [];

    if (roas >= 4) {
      recommendations.push('Scale budget gradually; current ROAS supports expansion.');
    } else if (roas >= 2) {
      recommendations.push('Hold budget steady and test new creatives to improve efficiency.');
    } else {
      recommendations.push('Do not increase spend until targeting and offer quality improve.');
    }

    if (roi < 0) {
      recommendations.push('Campaign is running at negative ROI; audit attribution and cut low-quality placements.');
    }

    if (conversions < 10) {
      recommendations.push('Conversion volume is still thin; gather more data before large optimization moves.');
    }

    return recommendations;
  }
}
