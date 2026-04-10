import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Billing Data Adapter
 * Collects revenue metrics from the Billing module for AI CEO analysis
 */
@Injectable()
export class BillingDataAdapter {
  private readonly logger = new Logger(BillingDataAdapter.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gather revenue metrics for organization
   */
  async gatherRevenueMetrics(organizationId: string) {
    try {
      // Get subscriptions for the organization
      const subscriptions = await this.prisma.subscription.findMany({
        where: { organizationId },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              pricePerMonth: true,
            },
          },
        },
      });

      // Get invoices for revenue tracking
      const invoices = await this.prisma.invoice.findMany({
        where: { subscription: { organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Calculate MRR (Monthly Recurring Revenue)
      const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
      const mrr = activeSubscriptions.reduce((sum, subscription) => {
        return sum + Number(subscription.plan?.pricePerMonth ?? 0);
      }, 0);

      // Calculate ARR (Annual Recurring Revenue)
      const arr = mrr * 12;

      // Calculate total revenue from completed invoices
      const totalRevenue = invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      // Calculate growth rate (compare last 30 days to previous 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const recentInvoices = invoices.filter((inv) => inv.createdAt >= thirtyDaysAgo && inv.status === 'PAID');
      const previousInvoices = invoices.filter(
        (inv) => inv.createdAt >= sixtyDaysAgo && inv.createdAt < thirtyDaysAgo && inv.status === 'PAID',
      );

      const recentRevenue = recentInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const previousRevenue = previousInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Revenue trend (group by week, last 12 weeks)
      const revenueTrend = await this.calculateRevenueTrend(organizationId);

      // Top revenue drivers (by subscription plan)
      const topFeatures = await this.getTopRevenueDrivers(organizationId);

      return {
        totalRevenue,
        mrr,
        arr,
        growthRate,
        revenueTrend,
        topFeatures,
        activeSubscriptions: activeSubscriptions.length,
      };
    } catch (error) {
      this.logger.error(`Error gathering revenue metrics: ${error.message}`, error.stack);
      return {
        totalRevenue: 0,
        mrr: 0,
        arr: 0,
        growthRate: 0,
        revenueTrend: [],
        topFeatures: [],
        activeSubscriptions: 0,
      };
    }
  }

  /**
   * Get churn metrics
   */
  async gatherChurnMetrics(organizationId: string) {
    try {
      // Get all subscriptions
      const allSubscriptions = await this.prisma.subscription.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      // Count cancelled subscriptions in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const cancelledRecently = allSubscriptions.filter((s) => s.status === 'CANCELLED' && s.cancelledAt && s.cancelledAt >= thirtyDaysAgo);

      // Calculate churn rate (cancelled / total)
      const activeCount = allSubscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL').length;
      const churnRate =
        activeCount > 0
          ? (cancelledRecently.length / (activeCount + cancelledRecently.length)) * 100
          : 0;

      // Identify at-risk customers (past due subscriptions)
      const atRiskCustomers = allSubscriptions.filter((s) => s.status === 'PAST_DUE').length;

      // Churn trend over time
      const churnTrend = await this.calculateChurnTrend(organizationId);

      return {
        churnRate,
        churnTrend,
        atRiskCustomers,
        churnReasons: new Map([['billing_issues', atRiskCustomers]]),
        predictedChurn30d: this.predictChurn(churnRate, 30),
        predictedChurn90d: this.predictChurn(churnRate, 90),
        bySegment: await this.getChurnBySegment(organizationId),
      };
    } catch (error) {
      this.logger.error(`Error gathering churn metrics: ${error.message}`, error.stack);
      return {
        churnRate: 0,
        churnTrend: [],
        atRiskCustomers: 0,
        churnReasons: new Map(),
        predictedChurn30d: 0,
        predictedChurn90d: 0,
        bySegment: [],
      };
    }
  }

  /**
   * Get pricing metrics
   */
  async gatherPricingMetrics(organizationId: string) {
    try {
      // Get subscription distribution by plan
      const subscriptions = await this.prisma.subscription.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              pricePerMonth: true,
            },
          },
        },
      });

      // Group by plan ID
      const planGroups = subscriptions.reduce(
        (acc, sub) => {
          const planId = sub.planId || 'unassigned';
          if (!acc[planId]) {
            acc[planId] = { count: 0, revenue: 0, name: sub.plan?.name || 'Unassigned plan' };
          }
          acc[planId].count++;
          acc[planId].revenue += Number(sub.plan?.pricePerMonth ?? 0);
          return acc;
        },
        {} as Record<string, { count: number; revenue: number; name: string }>,
      );

      const totalSubscriptions = subscriptions.length;
      const currentTiers = Object.entries(planGroups)
        .map(([planId, data]) => {
          const typedData = data as { count: number; revenue: number; name: string };
          return {
            name: typedData.name || planId,
            price: typedData.revenue / Math.max(typedData.count, 1),
            monthlyRecurringRevenue: typedData.revenue,
            subscriberCount: typedData.count,
            adoptionRate: totalSubscriptions > 0 ? typedData.count / totalSubscriptions : 0,
          };
        })
        .sort((a, b) => b.adoptionRate - a.adoptionRate);

      return {
        currentTiers,
        priceElasticity: 1.2,
        competitivePosition: 'market',
        priceOptimizationOpportunity: {
          recommended: 0,
          projectedImpact: 0,
          confidence: 0.5,
        },
      };
    } catch (error) {
      this.logger.error(`Error gathering pricing metrics: ${error.message}`, error.stack);
      return {
        currentTiers: [],
        priceElasticity: 1,
        competitivePosition: 'market',
        priceOptimizationOpportunity: {
          recommended: 0,
          projectedImpact: 0,
          confidence: 0,
        },
      };
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private async calculateRevenueTrend(
    organizationId: string,
  ): Promise<Array<{ date: string; value: number }>> {
    const invoices = await this.prisma.invoice.findMany({
      where: { subscription: { organizationId }, status: 'PAID' },
      orderBy: { createdAt: 'asc' },
    });

    // Group by week
    const weeklyRevenue = new Map<string, number>();
    invoices.forEach((inv) => {
      const weekStart = this.getWeekStart(inv.createdAt);
      const weekStr = weekStart.toISOString().split('T')[0];
      weeklyRevenue.set(weekStr, (weeklyRevenue.get(weekStr) || 0) + (inv.amount || 0));
    });

    return Array.from(weeklyRevenue.entries())
      .slice(-12)
      .map(([date, value]) => ({ date, value }));
  }

  private async calculateChurnTrend(
    organizationId: string,
  ): Promise<Array<{ date: string; rate: number }>> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'asc' },
    });

    // Group cancellations by week
    const weeklyCancellations = new Map<string, number>();
    subscriptions.forEach((sub) => {
      if (sub.status === 'CANCELLED' && sub.cancelledAt) {
        const weekStart = this.getWeekStart(sub.cancelledAt);
        const weekStr = weekStart.toISOString().split('T')[0];
        weeklyCancellations.set(weekStr, (weeklyCancellations.get(weekStr) || 0) + 1);
      }
    });

    return Array.from(weeklyCancellations.entries())
      .slice(-12)
      .map(([date, count]) => ({ date, rate: count }));
  }

  private async getChurnBySegment(organizationId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { organizationId },
    });

    const segments = new Map<string, { total: number; cancelled: number; churnRate: number }>();

    subscriptions.forEach((sub) => {
      const segment = sub.status || 'unknown';
      if (!segments.has(segment)) {
        segments.set(segment, { total: 0, cancelled: 0, churnRate: 0 });
      }

      const seg = segments.get(segment)!;
      seg.total++;
      if (sub.status === 'CANCELLED') seg.cancelled++;
    });

    segments.forEach((seg) => {
      seg.churnRate = seg.total > 0 ? (seg.cancelled / seg.total) * 100 : 0;
    });

    return Array.from(segments.entries()).map(([segment, data]) => ({
      segment,
      churnRate: data.churnRate,
      count: data.total,
    }));
  }

  private async getTopRevenueDrivers(organizationId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            pricePerMonth: true,
          },
        },
      },
    });

    const drivers: Record<string, { revenue: number; label: string }> = {};
    subscriptions.forEach((subscription) => {
      const planId = subscription.planId || 'unassigned';
      if (!drivers[planId]) {
        drivers[planId] = { revenue: 0, label: subscription.plan?.name || 'Unassigned plan' };
      }
      drivers[planId].revenue += Number(subscription.plan?.pricePerMonth ?? 0);
    });

    const totalRevenue = Object.values(drivers).reduce((sum, driver) => sum + driver.revenue, 0);

    return Object.entries(drivers)
      .map(([feature, driver]) => ({
        feature: driver.label || feature,
        contribution: totalRevenue > 0 ? driver.revenue / totalRevenue : 0,
      }))
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);
  }

  private predictChurn(currentRate: number, days: number): number {
    // Simple linear projection
    return Math.min(currentRate * (days / 30), 100);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}

