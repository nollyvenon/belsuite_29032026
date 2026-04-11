'use client';
import { useState } from 'react';
import { RevenueMetrics, useRevenue } from '../../hooks/useRevenue';

const PERIODS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

function fmt(n: number, prefix = '$') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}k`;
  return `${prefix}${n.toFixed(2)}`;
}

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function RevenuePage() {
  const { loading, error, getMetrics } = useRevenue();
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [period, setPeriod] = useState(30);

  const reload = async (days: number) => {
    const m = await getMetrics(days);
    setMetrics(m);
  };

  const maxRevenue = metrics ? Math.max(...metrics.dailyRevenue.map((d) => d.revenue), 1) : 1;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">MRR · ARR · Churn · Pipeline</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${period === p.value ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {loading && !metrics && <div className="text-center py-12 text-gray-400">Loading revenue data...</div>}

      {metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'MRR', value: fmt(metrics.revenue.mrr), sub: 'Monthly Recurring Revenue' },
              { label: 'ARR', value: fmt(metrics.revenue.arr), sub: 'Annual Run Rate' },
              { label: 'Total Revenue', value: fmt(metrics.revenue.total), badge: <GrowthBadge value={metrics.revenue.growth} /> },
              { label: 'Churn Rate', value: `${metrics.subscriptions.churnRate}%`, sub: `${metrics.subscriptions.cancelled} cancelled` },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {card.badge && <div className="mt-1">{card.badge}</div>}
                {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-sm mb-4">Daily Revenue ({period}d)</h3>
            <div className="flex items-end gap-1 h-32">
              {metrics.dailyRevenue.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-default"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '2px' : '0' }}
                  title={`${d.date}: ${fmt(d.revenue)}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>{metrics.dailyRevenue[0]?.date}</span>
              <span>{metrics.dailyRevenue[metrics.dailyRevenue.length - 1]?.date}</span>
            </div>
          </div>

          {/* Pipeline + Subscription */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-3">Deal Pipeline</h3>
              <div className="space-y-2">
                {[
                  { label: 'Open Deals', value: String(metrics.pipeline.openDeals) },
                  { label: 'Pipeline Value', value: fmt(metrics.pipeline.pipelineValue) },
                  { label: 'Won Deals', value: `${metrics.pipeline.wonDeals} (was ${metrics.pipeline.prevWonDeals})` },
                  { label: 'Won Value', value: fmt(metrics.pipeline.wonValue) },
                  { label: 'Win Rate', value: `${metrics.pipeline.winRate}%` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-3">Subscription Health</h3>
              <div className="space-y-2">
                {[
                  { label: 'Status', value: metrics.subscriptions.currentStatus },
                  { label: 'Plan', value: metrics.subscriptions.planId ?? '—' },
                  { label: 'Active', value: String(metrics.subscriptions.active) },
                  { label: 'Cancelled', value: String(metrics.subscriptions.cancelled) },
                  { label: 'Churn Rate', value: `${metrics.subscriptions.churnRate}%` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
