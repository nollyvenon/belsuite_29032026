import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AnalyticsDashboardResponse,
  AnalyticsOverview,
  AnalyticsTimeseriesPoint,
  EngagementBreakdownItem,
  RevenueAttributionRow,
  TopContentItem,
} from '../analytics.types';
import { AnalyticsPipelineService } from './analytics-pipeline.service';

type AnalyticsBundle = {
  events: Array<{ eventType: string; timestamp: Date; contentId: string | null; properties: string | null }>;
  contents: Array<{ id: string; title: string; type: string; status: string; views: number; likes: number; publishedAt: Date | null }>;
  payments: Array<{ amount: number; refundedAmount: number; paidAt: Date | null; createdAt: Date }>;
  videos: Array<{ status: string; updatedAt: Date; createdAt: Date }>;
  posts: Array<{ status: string; publishedAt: Date | null; createdAt: Date }>;
  campaigns: Array<{ status: string }>;
  campaignPerformance: Array<{ date: Date; revenue: number; conversions: number; clicks: number; impressions: number }>;
  conversions: Array<{
    occurredAt: Date;
    value: number | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    eventType: string;
  }>;
};

@Injectable()
export class AnalyticsDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: AnalyticsPipelineService,
  ) {}

  async getDashboard(organizationId: string, days = 30): Promise<AnalyticsDashboardResponse> {
    const bundle = await this.loadBundle(organizationId, days);

    return {
      overview: this.buildOverview(bundle, days),
      performanceChart: this.buildPerformanceChart(bundle, days),
      engagementBreakdown: this.buildEngagementBreakdown(bundle),
      revenueAttribution: this.buildRevenueAttribution(bundle),
      topContent: this.buildTopContent(bundle, 8),
    };
  }

  async getPerformanceChart(organizationId: string, days = 30) {
    return this.buildPerformanceChart(await this.loadBundle(organizationId, days), days);
  }

  async getEngagementBreakdown(organizationId: string, days = 30) {
    return this.buildEngagementBreakdown(await this.loadBundle(organizationId, days));
  }

  async getRevenueAttribution(organizationId: string, days = 30) {
    return this.buildRevenueAttribution(await this.loadBundle(organizationId, days));
  }

  async getTopContent(organizationId: string, days = 30, limit = 10) {
    return this.buildTopContent(await this.loadBundle(organizationId, days), limit);
  }

  async getOverview(organizationId: string, days = 30) {
    return this.buildOverview(await this.loadBundle(organizationId, days), days);
  }

  private async loadBundle(organizationId: string, days: number): Promise<AnalyticsBundle> {
    const since = this.getSince(days);

    const [events, contents, payments, videos, posts, campaigns, campaignPerformance, conversions] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { organizationId, timestamp: { gte: since } },
        select: { eventType: true, timestamp: true, contentId: true, properties: true },
      }),
      this.prisma.content.findMany({
        where: { organizationId },
        select: { id: true, title: true, type: true, status: true, views: true, likes: true, publishedAt: true },
      }),
      this.prisma.payment.findMany({
        where: {
          subscription: { organizationId },
          OR: [{ paidAt: { gte: since } }, { createdAt: { gte: since } }],
          status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
        },
        select: { amount: true, refundedAmount: true, paidAt: true, createdAt: true },
      }),
      this.prisma.videoProject.findMany({
        where: { organizationId, OR: [{ updatedAt: { gte: since } }, { createdAt: { gte: since } }] },
        select: { status: true, updatedAt: true, createdAt: true },
      }),
      this.prisma.scheduledPost.findMany({
        where: { organizationId, OR: [{ publishedAt: { gte: since } }, { createdAt: { gte: since } }] },
        select: { status: true, publishedAt: true, createdAt: true },
      }),
      this.prisma.marketingCampaign.findMany({
        where: { organizationId },
        select: { status: true },
      }),
      this.prisma.campaignPerformance.findMany({
        where: { campaign: { organizationId }, date: { gte: since } },
        select: { date: true, revenue: true, conversions: true, clicks: true, impressions: true },
      }),
      this.prisma.conversionEvent.findMany({
        where: { organizationId, occurredAt: { gte: since } },
        select: {
          occurredAt: true,
          value: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          eventType: true,
        },
      }),
    ]);

    return { events, contents, payments, videos, posts, campaigns, campaignPerformance, conversions };
  }

  private buildOverview(bundle: AnalyticsBundle, days: number): AnalyticsOverview {
    const viewEvents = bundle.events.filter((event) => this.pipeline.isViewEvent(event.eventType)).length;
    const trackedViews = viewEvents > 0
      ? viewEvents
      : bundle.contents.reduce((sum, item) => sum + item.views, 0);

    const engagementEvents = bundle.events.filter((event) => this.pipeline.isEngagementEvent(event.eventType)).length;
    const engagements = engagementEvents > 0
      ? engagementEvents
      : bundle.contents.reduce((sum, item) => sum + item.likes, 0);

    const conversions = bundle.conversions.length;
    const totalRevenue = this.round2(bundle.payments.reduce((sum, item) => sum + Math.max(item.amount - item.refundedAmount, 0), 0));
    const attributedRevenue = this.round2(bundle.conversions.reduce((sum, item) => sum + (item.value ?? 0), 0));
    const publishedContent = bundle.contents.filter((item) => item.status === 'PUBLISHED').length;
    const publishedPosts = bundle.posts.filter((item) => item.status === 'PUBLISHED').length;
    const videosReady = bundle.videos.filter((item) => item.status === 'READY').length;
    const activeCampaigns = bundle.campaigns.filter((item) => item.status === 'ACTIVE').length;

    return {
      periodDays: days,
      totalEvents: bundle.events.length,
      trackedViews,
      engagements,
      engagementRate: trackedViews > 0 ? this.round2((engagements / trackedViews) * 100) : 0,
      totalRevenue,
      attributedRevenue,
      conversions,
      publishedContent,
      publishedPosts,
      videosReady,
      activeCampaigns,
      moduleBreakdown: [
        {
          module: 'CONTENT',
          primaryLabel: 'Views',
          primaryValue: trackedViews,
          secondaryLabel: 'Published',
          secondaryValue: publishedContent,
        },
        {
          module: 'SOCIAL',
          primaryLabel: 'Published Posts',
          primaryValue: publishedPosts,
          secondaryLabel: 'Engagements',
          secondaryValue: engagements,
        },
        {
          module: 'VIDEO',
          primaryLabel: 'Ready Videos',
          primaryValue: videosReady,
          secondaryLabel: 'Projects',
          secondaryValue: bundle.videos.length,
        },
        {
          module: 'MARKETING',
          primaryLabel: 'Attributed Revenue',
          primaryValue: attributedRevenue,
          secondaryLabel: 'Conversions',
          secondaryValue: conversions,
        },
        {
          module: 'PAYMENTS',
          primaryLabel: 'Collected Revenue',
          primaryValue: totalRevenue,
          secondaryLabel: 'Payments',
          secondaryValue: bundle.payments.length,
        },
      ],
    };
  }

  private buildPerformanceChart(bundle: AnalyticsBundle, days: number): AnalyticsTimeseriesPoint[] {
    const buckets = this.buildDateBuckets(days);

    for (const event of bundle.events) {
      const key = this.dateKey(event.timestamp);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      if (this.pipeline.isViewEvent(event.eventType)) bucket.views += 1;
      if (this.pipeline.isEngagementEvent(event.eventType)) bucket.engagements += 1;
    }

    for (const payment of bundle.payments) {
      const pointDate = payment.paidAt ?? payment.createdAt;
      const bucket = buckets.get(this.dateKey(pointDate));
      if (!bucket) continue;
      bucket.revenue += Math.max(payment.amount - payment.refundedAmount, 0);
    }

    for (const conversion of bundle.conversions) {
      const bucket = buckets.get(this.dateKey(conversion.occurredAt));
      if (!bucket) continue;
      bucket.conversions += 1;
      bucket.attributedRevenue += conversion.value ?? 0;
    }

    for (const content of bundle.contents) {
      if (!content.publishedAt) continue;
      const bucket = buckets.get(this.dateKey(content.publishedAt));
      if (bucket) bucket.publishedContent += 1;
    }

    for (const post of bundle.posts) {
      if (!post.publishedAt) continue;
      const bucket = buckets.get(this.dateKey(post.publishedAt));
      if (bucket) bucket.publishedPosts += 1;
    }

    for (const video of bundle.videos) {
      if (video.status !== 'READY') continue;
      const bucket = buckets.get(this.dateKey(video.updatedAt));
      if (bucket) bucket.videosReady += 1;
    }

    return Array.from(buckets.values()).map((point) => ({
      ...point,
      revenue: this.round2(point.revenue),
      attributedRevenue: this.round2(point.attributedRevenue),
    }));
  }

  private buildEngagementBreakdown(bundle: AnalyticsBundle): {
    byType: EngagementBreakdownItem[];
    byChannel: EngagementBreakdownItem[];
  } {
    const typeMap = new Map<string, number>();
    const channelMap = new Map<string, number>();

    for (const event of bundle.events) {
      if (!this.pipeline.isEngagementEvent(event.eventType)) continue;

      typeMap.set(event.eventType, (typeMap.get(event.eventType) ?? 0) + 1);

      const properties = this.pipeline.parseProperties(event.properties);
      const channel = String(properties['channel'] ?? properties['sourceModule'] ?? properties['source'] ?? 'APP');
      channelMap.set(channel, (channelMap.get(channel) ?? 0) + 1);
    }

    return {
      byType: this.mapBreakdown(typeMap),
      byChannel: this.mapBreakdown(channelMap),
    };
  }

  private buildRevenueAttribution(bundle: AnalyticsBundle): RevenueAttributionRow[] {
    const rows = new Map<string, RevenueAttributionRow>();
    const totalRevenue = bundle.conversions.reduce((sum, item) => sum + (item.value ?? 0), 0);

    for (const item of bundle.conversions) {
      const source = item.utmSource ?? 'DIRECT';
      const medium = item.utmMedium ?? null;
      const campaign = item.utmCampaign ?? null;
      const key = `${source}|${medium ?? ''}|${campaign ?? ''}`;
      const existing = rows.get(key) ?? {
        source,
        medium,
        campaign,
        revenue: 0,
        conversions: 0,
        percentage: 0,
      };

      existing.revenue += item.value ?? 0;
      existing.conversions += 1;
      rows.set(key, existing);
    }

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        revenue: this.round2(row.revenue),
        percentage: totalRevenue > 0 ? this.round2((row.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildTopContent(bundle: AnalyticsBundle, limit: number): TopContentItem[] {
    const eventMap = new Map<string, { views: number; engagements: number }>();

    for (const event of bundle.events) {
      if (!event.contentId) continue;
      const current = eventMap.get(event.contentId) ?? { views: 0, engagements: 0 };
      if (this.pipeline.isViewEvent(event.eventType)) current.views += 1;
      if (this.pipeline.isEngagementEvent(event.eventType)) current.engagements += 1;
      eventMap.set(event.contentId, current);
    }

    return bundle.contents
      .map((item) => {
        const tracked = eventMap.get(item.id);
        const views = tracked?.views ?? item.views;
        const engagements = tracked?.engagements ?? item.likes;
        const engagementRate = views > 0 ? this.round2((engagements / views) * 100) : 0;
        const score = this.round2(views + engagements * 4 + engagementRate * 2);

        return {
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          views,
          engagements,
          engagementRate,
          score,
          publishedAt: item.publishedAt,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private buildDateBuckets(days: number) {
    const map = new Map<string, AnalyticsTimeseriesPoint>();
    const now = new Date();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = this.dateKey(date);
      map.set(key, {
        date: key,
        views: 0,
        engagements: 0,
        revenue: 0,
        attributedRevenue: 0,
        conversions: 0,
        publishedContent: 0,
        publishedPosts: 0,
        videosReady: 0,
      });
    }
    return map;
  }

  private mapBreakdown(map: Map<string, number>): EngagementBreakdownItem[] {
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        value,
        percentage: total > 0 ? this.round2((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  private getSince(days: number) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));
    return since;
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }
}