import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Organizations Data Adapter
 * Collects growth and customer metrics from Organizations module for AI CEO
 */
@Injectable()
export class OrganizationsDataAdapter {
  private readonly logger = new Logger(OrganizationsDataAdapter.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gather customer growth metrics
   */
  async gatherGrowthMetrics(organizationId: string) {
    try {
      // Get organization members (users in this org)
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      });

      const users = members.map((m) => m.user);

      // Calculate growth rate
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const recentUsers = members.filter((m) => m.joinedAt >= thirtyDaysAgo).length;
      const previousUsers = members.filter((m) => m.joinedAt >= sixtyDaysAgo && m.joinedAt < thirtyDaysAgo).length;

      const growthRate = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

      // Growth trend (weekly)
      const growthTrend = this.calculateGrowthTrend(members.map((m) => ({ createdAt: m.joinedAt })));

      // Customer segments
      const segments = await this.getCustomerSegments(organizationId);

      return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
        growthRate,
        growthTrend,
        segments,
        acquisitionChannels: [],
        acquisitionCostOpportunity: { estimatedSavings: 5000, recommendation: 'Focus on organic growth' },
        retentionOpportunity: {
          atRiskUsers: users.filter((u) => u.status === 'INACTIVE').length,
          recommendation: 'Re-engage inactive users with targeted campaigns',
        },
      };
    } catch (error) {
      this.logger.error(`Error gathering growth metrics: ${error.message}`, error.stack);
      return {
        totalUsers: 0,
        activeUsers: 0,
        growthRate: 0,
        growthTrend: [],
        segments: [],
        acquisitionChannels: [],
        acquisitionCostOpportunity: { estimatedSavings: 0, recommendation: '' },
        retentionOpportunity: { atRiskUsers: 0, recommendation: '' },
      };
    }
  }

  /**
   * Gather customer lifecycle metrics
   */
  async gatherLifecycleMetrics(organizationId: string) {
    try {
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        include: { user: true },
      });

      // Segment by lifecycle stage
      const stages = {
        awareness: members.filter((m) => this.daysSinceCreation(m.joinedAt) < 7).length,
        consideration: members.filter(
          (m) => this.daysSinceCreation(m.joinedAt) >= 7 && this.daysSinceCreation(m.joinedAt) < 30,
        ).length,
        adoption: members.filter((m) => this.daysSinceCreation(m.joinedAt) >= 30).length,
        retention: members.filter((m) => this.daysSinceCreation(m.joinedAt) >= 90).length,
        advocacy: members.filter((m) => this.daysSinceCreation(m.joinedAt) >= 180).length,
      };

      const conversions = {
        awarenessToConsideration: stages.awareness > 0 ? (stages.consideration / stages.awareness) * 100 : 0,
        considerationToAdoption: stages.consideration > 0 ? (stages.adoption / stages.consideration) * 100 : 0,
        adoptionToRetention: stages.adoption > 0 ? (stages.retention / stages.adoption) * 100 : 0,
      };

      return {
        stages,
        conversions,
        averageLTVByStage: [
          { stage: 'awareness', ltv: 50 },
          { stage: 'consideration', ltv: 150 },
          { stage: 'adoption', ltv: 500 },
          { stage: 'retention', ltv: 2000 },
          { stage: 'advocacy', ltv: 5000 },
        ],
        churnRiskByStage: [
          { stage: 'awareness', riskScore: 0.8 },
          { stage: 'consideration', riskScore: 0.6 },
          { stage: 'adoption', riskScore: 0.3 },
          { stage: 'retention', riskScore: 0.1 },
          { stage: 'advocacy', riskScore: 0.05 },
        ],
        opportunitiesPerStage: this.identifyLifecycleOpportunities(conversions),
      };
    } catch (error) {
      this.logger.error(`Error gathering lifecycle metrics: ${error.message}`, error.stack);
      return {
        stages: {},
        conversions: {},
        averageLTVByStage: [],
        churnRiskByStage: [],
        opportunitiesPerStage: [],
      };
    }
  }

  /**
   * Gather organization health metrics
   */
  async gatherOrganizationHealth(organizationId: string) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      // Count active members
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        include: { user: true },
      });

      // Count subscriptions
      const subscriptions = await this.prisma.subscription.findMany({
        where: { organizationId },
      });

      // Basic health score
      const healthScore = await this.calculateHealthScore(organizationId, members, subscriptions);

      return {
        overallHealth: healthScore,
        metrics: {},
        riskFactors: await this.identifyRiskFactors(organizationId),
        recommendations: await this.generateHealthRecommendations(healthScore),
      };
    } catch (error) {
      this.logger.error(`Error gathering organization health: ${error.message}`, error.stack);
      return {
        overallHealth: 0,
        metrics: {},
        riskFactors: [],
        recommendations: [],
      };
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private calculateGrowthTrend(users: Array<{ createdAt: Date }>): Array<{ date: string; count: number }> {
    const byWeek = new Map<string, number>();
    users.forEach((user) => {
      const weekStart = this.getWeekStart(user.createdAt);
      const weekStr = weekStart.toISOString().split('T')[0];
      byWeek.set(weekStr, (byWeek.get(weekStr) || 0) + 1);
    });
    return Array.from(byWeek.entries())
      .slice(-12)
      .map(([date, count]) => ({ date, count }));
  }

  private async getCustomerSegments(organizationId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { organizationId },
    });

    const segments = new Map<string, { count: number }>();
    subscriptions.forEach((sub) => {
      const planId = sub.planId || 'free';
      if (!segments.has(planId)) {
        segments.set(planId, { count: 0 });
      }
      const seg = segments.get(planId)!;
      seg.count++;
    });

    return Array.from(segments.entries()).map(([name, data]) => ({
      name,
      users: data.count,
      percentage: subscriptions.length > 0 ? (data.count / subscriptions.length) * 100 : 0,
    }));
  }

  private identifyLifecycleOpportunities(conversions: Record<string, number>): string[] {
    const opportunities: string[] = [];
    if (conversions.awarenessToConsideration < 30) {
      opportunities.push('Improve onboarding to boost awareness→consideration conversion');
    }
    if (conversions.considerationToAdoption < 20) {
      opportunities.push('Reduce friction in trial-to-paid conversion');
    }
    if (conversions.adoptionToRetention < 50) {
      opportunities.push('Strengthen retention strategies for new customers');
    }
    return opportunities;
  }

  private async calculateHealthScore(
    organizationId: string,
    members: any[],
    subscriptions: any[],
  ): Promise<number> {
    let score = 100;

    // Deduct for inactive users
    const activeMembers = members.filter((m) => m.user.status === 'ACTIVE').length;
    const inactiveRatio = 1 - (activeMembers / Math.max(members.length, 1));
    score -= inactiveRatio * 20;

    // Deduct for no subscriptions
    if (!subscriptions || subscriptions.length === 0) {
      score -= 20;
    }

    return Math.max(score, 0);
  }

  private async identifyRiskFactors(organizationId: string): Promise<string[]> {
    return ['Monitor user engagement trends', 'Track subscription churn'];
  }

  private async generateHealthRecommendations(healthScore: number): Promise<string[]> {
    if (healthScore > 80) {
      return ['Maintain current operations', 'Focus on growth initiatives'];
    }
    if (healthScore > 60) {
      return ['Address data quality issues', 'Improve user engagement'];
    }
    return ['Critical: Immediate action needed', 'Review organization setup'];
  }

  private daysSinceCreation(date: Date): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}
