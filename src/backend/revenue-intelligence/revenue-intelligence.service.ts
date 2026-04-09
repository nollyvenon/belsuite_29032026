import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RevenueIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(organizationId: string, days = 30) {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - days);
    const prevPeriodStart = new Date(since);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - days);

    // Get the org's subscription to query payments
    const subscription = await this.prisma.subscription.findFirst({
      where: { organizationId },
      select: { id: true, status: true, cancelledAt: true, planId: true, createdAt: true },
    });

    // All subscriptions for org (only one per orgId due to @@unique)
    const [payments, prevPayments, allSubscriptions, deals, prevDeals] = await Promise.all([
      subscription
        ? this.prisma.payment.findMany({
            where: { subscriptionId: subscription.id, status: 'COMPLETED', createdAt: { gte: since } },
            select: { amount: true, currency: true, createdAt: true },
          })
        : Promise.resolve([] as Array<{ amount: number; currency: string; createdAt: Date }>),
      subscription
        ? this.prisma.payment.findMany({
            where: { subscriptionId: subscription.id, status: 'COMPLETED', createdAt: { gte: prevPeriodStart, lt: since } },
            select: { amount: true },
          })
        : Promise.resolve([] as Array<{ amount: number }>),
      this.prisma.subscription.findMany({
        where: { organizationId },
        select: { status: true, planId: true, createdAt: true, cancelledAt: true },
      }),
      this.prisma.deal.findMany({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.deal.findMany({
        where: { organizationId, createdAt: { gte: prevPeriodStart, lt: since } },
      }),
    ]);

    const totalRevenue = payments.reduce((s: number, p) => s + (p.amount as number), 0);
    const prevRevenue = prevPayments.reduce((s: number, p) => s + (p.amount as number), 0);
    const revenueGrowth = (prevRevenue as number) > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const activeSubscriptions = allSubscriptions.filter((s) => s.status === 'ACTIVE').length;
    const cancelledSubscriptions = allSubscriptions.filter((s) => s.cancelledAt).length;
    const churnRate = allSubscriptions.length > 0
      ? (cancelledSubscriptions / allSubscriptions.length) * 100
      : 0;

    // MRR estimate: total payments / days * 30
    const mrr = days > 0 ? this.round2(((totalRevenue as number) / days) * 30) : 0;
    const arr = this.round2(mrr * 12);

    // Deal pipeline
    const pipelineDeals = deals.filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
    const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
    const pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0);
    const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    // Revenue by day
    const dailyRevenue = this.buildDailySeries(payments, days);

    return {
      periodDays: days,
      revenue: {
        total: this.round2(totalRevenue),
        prevTotal: this.round2(prevRevenue),
        growth: this.round2(revenueGrowth),
        mrr,
        arr,
      },
      subscriptions: {
        active: activeSubscriptions,
        cancelled: cancelledSubscriptions,
        churnRate: this.round2(churnRate),
        currentStatus: subscription?.status ?? 'NONE',
        planId: subscription?.planId ?? null,
      },
      pipeline: {
        openDeals: pipelineDeals.length,
        wonDeals: wonDeals.length,
        pipelineValue: this.round2(pipelineValue),
        wonValue: this.round2(wonValue),
        winRate: this.round2(winRate),
        prevWonDeals: prevDeals.filter((d) => d.stage === 'CLOSED_WON').length,
      },
      dailyRevenue,
    };
  }

  private buildDailySeries(payments: Array<{ amount: number; createdAt: Date }>, days: number) {
    const today = new Date();
    const series: Array<{ date: string; revenue: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = payments
        .filter((p) => p.createdAt.toISOString().startsWith(dateStr))
        .reduce((s, p) => s + p.amount, 0);
      series.push({ date: dateStr, revenue: this.round2(dayRevenue) });
    }

    return series;
  }

  private round2(n: number) { return Math.round(n * 100) / 100; }
}
