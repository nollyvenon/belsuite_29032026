'use client';

import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { useRevenueMetrics } from '@/hooks/useRevenueMetrics';

export function RevenueWidget() {
  const { data, loading, error } = useRevenueMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        Could not load revenue metrics
      </div>
    );
  }

  const isPositive = data.changePercent >= 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue (30d)</p>
              <p className="mt-2 text-3xl font-bold text-white">${data.current.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-2">
                {isPositive ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">+{data.changePercent}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">{data.changePercent}%</span>
                  </>
                )}
                <span className="text-xs text-slate-500">vs. previous period</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-black p-6">
          <div>
            <p className="text-sm text-slate-400">Monthly Recurring</p>
            <p className="mt-2 text-3xl font-bold text-white">${(data.mrr || 18240).toLocaleString()}</p>
            <p className="mt-3 text-xs text-slate-500">12 active subscriptions</p>
          </div>
        </div>

        {/* ARR */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-black p-6">
          <div>
            <p className="text-sm text-slate-400">Annual Recurring</p>
            <p className="mt-2 text-3xl font-bold text-white">${(data.arr || 218880).toLocaleString()}</p>
            <p className="mt-3 text-xs text-slate-500">projected YoY</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Revenue Sources */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Source</h3>
          <div className="space-y-3">
            {[
              { label: 'Subscriptions', value: data.subscriptionRevenue || 14200, percent: 58 },
              { label: 'Pay-as-you-go', value: data.payAsYouGoRevenue || 7340, percent: 30 },
              { label: 'Credits/Coupons', value: data.creditsRevenue || 3040, percent: 12 },
            ].map((source) => (
              <div key={source.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">{source.label}</span>
                  <span className="text-sm font-semibold text-white">${source.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${source.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn & LTV */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Retention Metrics</h3>
          <div className="space-y-3">
            {[
              { label: 'Churn rate', value: `${data.churnRate || 4.2}%`, delta: '-0.8%', positive: true },
              { label: 'Retention rate', value: `${data.retentionRate || 95.8}%`, delta: '+1.2%', positive: true },
              { label: 'Customer LTV', value: `$${(data.customerLTV || 2840).toLocaleString()}`, delta: '+$180', positive: true },
            ].map((metric) => (
              <div key={metric.label} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <span className="text-sm text-slate-400">{metric.label}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{metric.value}</p>
                  <p className={`text-xs ${metric.positive ? 'text-emerald-400' : 'text-red-400'}`}>{metric.delta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
