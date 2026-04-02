'use client';

import { createApiClient } from '../client';

const billingClient = createApiClient('/api/v1/billing');
const analyticsClient = createApiClient('/api/analytics');

export interface RevenueMetrics {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  mrr: number;
  arr: number;
  subscriptionRevenue: number;
  payAsYouGoRevenue: number;
  creditsRevenue: number;
  churnRate: number;
  retentionRate: number;
  customerLTV: number;
}

export async function getRevenueMetrics(days = 30): Promise<RevenueMetrics> {
  const [billingOverview, analyticsRevenue] = await Promise.allSettled([
    billingClient.get<any>('/overview'),
    analyticsClient.get<any>('/revenue', { days }),
  ]);

  const billing = billingOverview.status === 'fulfilled' ? billingOverview.value : null;
  const analytics = analyticsRevenue.status === 'fulfilled' ? analyticsRevenue.value : null;

  const currentRevenue = Number(billing?.totalAmount ?? billing?.usage?.summary?.totalAmount ?? analytics?.current ?? 0);
  const previousRevenue = Number(analytics?.previous ?? 0);
  const change = currentRevenue - previousRevenue;
  const changePercent = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0;

  return {
    current: currentRevenue,
    previous: previousRevenue,
    change,
    changePercent,
    mrr: Number(analytics?.mrr ?? 0),
    arr: Number(analytics?.arr ?? 0),
    subscriptionRevenue: Number(analytics?.subscriptionRevenue ?? 0),
    payAsYouGoRevenue: Number(analytics?.payAsYouGoRevenue ?? 0),
    creditsRevenue: Number(analytics?.creditsRevenue ?? 0),
    churnRate: Number(analytics?.churnRate ?? 0),
    retentionRate: Number(analytics?.retentionRate ?? 0),
    customerLTV: Number(analytics?.customerLTV ?? 0),
  };
}
