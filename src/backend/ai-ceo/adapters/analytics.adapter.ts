import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Analytics Data Adapter
 * Collects usage and engagement metrics from Analytics module for AI CEO
 */
@Injectable()
export class AnalyticsDataAdapter {
  private readonly logger = new Logger(AnalyticsDataAdapter.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gather feature adoption and usage metrics
   */
  async gatherFeatureMetrics(organizationId: string) {
    try {
      // Get analytics events
      const events = await this.prisma.analyticsEvent.findMany({
        where: { organizationId },
        orderBy: { timestamp: 'desc' },
        take: 10000,
      });

      // Group by event type
      const featureUsage = new Map<string, { count: number; users: Set<string>; lastUsed: Date }>();

      events.forEach((event) => {
        const feature = event.eventType || 'unknown';
        if (!featureUsage.has(feature)) {
          featureUsage.set(feature, { count: 0, users: new Set(), lastUsed: new Date(0) });
        }

        const usage = featureUsage.get(feature)!;
        usage.count++;
        if (event.userId) {
          usage.users.add(event.userId);
        }
        if (event.timestamp > usage.lastUsed) {
          usage.lastUsed = event.timestamp;
        }
      });

      // Calculate feature metrics
      const features = Array.from(featureUsage.entries())
        .map(([featureName, data]) => ({
          name: featureName,
          usageCount: data.count,
          uniqueUsers: data.users.size,
          adoptionRate: 0,
          lastUsed: data.lastUsed,
          trend: this.calculateTrend(events, featureName),
        }))
        .sort((a, b) => b.usageCount - a.usageCount);

      // Most used features
      const mostUsed = features.slice(0, 5);
      const underutilized = features.filter((f) => f.usageCount < (features[0]?.usageCount || 1) * 0.1).slice(0, 5);

      return {
        totalFeatures: features.length,
        mostUsedFeatures: mostUsed,
        underutilizedFeatures: underutilized,
        overallEngagement: await this.getOverallEngagement(organizationId),
        featureTrends: await this.getFeatureTrends(organizationId),
        recommendations: this.generateFeatureRecommendations(features),
      };
    } catch (error) {
      this.logger.error(`Error gathering feature metrics: ${error.message}`, error.stack);
      return {
        totalFeatures: 0,
        mostUsedFeatures: [],
        underutilizedFeatures: [],
        overallEngagement: { activeUsers: 0, sessionCount: 0, avgSessionDuration: 0 },
        featureTrends: [],
        recommendations: [],
      };
    }
  }

  /**
   * Gather user engagement metrics (used for churn analysis)
   */
  async gatherEngagementMetrics(organizationId: string) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          timestamp: { gte: thirtyDaysAgo },
        },
      });

      // Active users
      const activeUsers = new Set(events.map((e) => e.userId).filter(Boolean)).size;

      // Event type engagement
      const eventTypeEngagement = this.getEngagementByType(events);

      // Churn-related metrics
      return {
        churnRate: await this.calculateChurnRate(organizationId),
        churnTrend: [],
        atRiskCustomers: await this.getAtRiskCustomerCount(organizationId),
        churnReasons: new Map(),
        predictedChurn30d: 0,
        predictedChurn90d: 0,
        bySegment: [],
      };
    } catch (error) {
      this.logger.error(`Error gathering engagement metrics: ${error.message}`, error.stack);
      return {
        activeUsers: 0,
        sessionCount: 0,
        avgSessionDuration: 0,
        dualTrend: [],
        cohortEngagement: [],
        retentionRate: 0,
        stickiness: 0,
      };
    }
  }

  /**
   * Gather content performance metrics
   */
  async gatherContentMetrics(organizationId: string) {
    try {
      // Get content items
      const contents = await this.prisma.content.findMany({
        where: { organizationId },
      });

      const performanceMetrics = contents.map((c) => ({
        id: c.id,
        name: c.title,
        type: c.type,
        views: c.views || 0,
        likes: c.likes || 0,
        engagementRate: (c.likes || 0) / Math.max(c.views || 1, 1),
        createdAt: c.createdAt,
        performanceScore: (c.views || 0) * 0.7 + (c.likes || 0) * 10,
      }));

      // Top performing content
      const topPerforming = performanceMetrics.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);

      // Content by type
      const contentByType: Record<string, any> = {};
      performanceMetrics.forEach((item) => {
        if (!contentByType[item.type]) {
          contentByType[item.type] = { count: 0, avgEngagement: 0, total: 0 };
        }
        contentByType[item.type].count++;
        contentByType[item.type].total += item.engagementRate;
      });

      Object.values(contentByType).forEach((stat: any) => {
        stat.avgEngagement = stat.total / Math.max(stat.count, 1);
      });

      return {
        totalContent: contents.length,
        topPerforming,
        contentByType,
        avgEngagementRate:
          performanceMetrics.length > 0
            ? performanceMetrics.reduce((sum, c) => sum + c.engagementRate, 0) / performanceMetrics.length
            : 0,
        improvementOpportunities: await this.getContentImprovementOpportunities(organizationId),
      };
    } catch (error) {
      this.logger.error(`Error gathering content metrics: ${error.message}`, error.stack);
      return {
        totalContent: 0,
        topPerforming: [],
        contentByType: {},
        avgEngagementRate: 0,
        improvementOpportunities: [],
      };
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private calculateTrend(events: any[], featureName: string): Array<{ date: string; count: number }> {
    const byDate = new Map<string, number>();
    events.forEach((event) => {
      if (event.eventType === featureName) {
        const dateStr = event.timestamp.toISOString().split('T')[0];
        byDate.set(dateStr, (byDate.get(dateStr) || 0) + 1);
      }
    });
    return Array.from(byDate.entries())
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  }

  private async getOverallEngagement(organizationId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return {
      activeUsers: new Set(events.map((e) => e.userId).filter(Boolean)).size,
      sessionCount: events.length,
      avgSessionDuration: 1800,
    };
  }

  private async getFeatureTrends(organizationId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'asc' },
      take: 5000,
    });

    const weeklyTrends = new Map<string, Map<string, number>>();
    events.forEach((event) => {
      const weekStart = this.getWeekStart(event.timestamp);
      const weekStr = weekStart.toISOString().split('T')[0];
      const feature = event.eventType || 'unknown';

      if (!weeklyTrends.has(weekStr)) {
        weeklyTrends.set(weekStr, new Map());
      }
      const featureMap = weeklyTrends.get(weekStr)!;
      featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
    });

    return Array.from(weeklyTrends.entries())
      .slice(-12)
      .map(([week, features]) => ({
        week,
        features: Object.fromEntries(features),
      }));
  }

  private generateFeatureRecommendations(features: Array<{ name: string; usageCount: number }>): string[] {
    const recommendations: string[] = [];
    if (features.length === 0) return recommendations;

    const underutilized = features.filter((f) => f.usageCount < 10).length;
    if (underutilized > features.length * 0.5) {
      recommendations.push('Consider consolidating underutilized features to reduce complexity');
    }

    if (features[0].usageCount > features.reduce((s, f) => s + f.usageCount, 0) * 0.5) {
      recommendations.push(`Feature "${features[0].name}" is highly popular; promote complementary features`);
    }

    return recommendations;
  }

  private getEngagementByType(events: any[]) {
    const byType = new Map<string, number>();
    events.forEach((e) => {
      const type = e.eventType || 'unknown';
      byType.set(type, (byType.get(type) || 0) + 1);
    });
    return Array.from(byType.entries())
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  private async calculateChurnRate(organizationId: string): Promise<number> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { organizationId },
      take: 100,
    });

    const cancelled = subscriptions.filter((s) => s.status === 'CANCELLED').length;
    return subscriptions.length > 0 ? (cancelled / subscriptions.length) * 100 : 0;
  }

  private async getAtRiskCustomerCount(organizationId: string): Promise<number> {
    const riskySubs = await this.prisma.subscription.findMany({
      where: {
        organizationId,
        status: { in: ['PAST_DUE', 'PAUSED'] },
      },
    });
    return riskySubs.length;
  }

  private async getContentImprovementOpportunities(organizationId: string) {
    return [
      'Analyze underperforming content for common themes',
      'Increase frequency of top-performing content types',
      'Test different content formats for better engagement',
    ];
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}
