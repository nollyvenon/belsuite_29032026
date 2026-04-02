'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, BarChart3, Download, Loader2, RefreshCw, Share2, TrendingUp } from 'lucide-react';
import { AnalyticsInsightsPanel } from '@/components/analytics/AnalyticsInsightsPanel';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { PerformanceCharts } from '@/components/analytics/PerformanceCharts';
import { RevenueAttributionPanel } from '@/components/analytics/RevenueAttributionPanel';
import { TopContentPanel } from '@/components/analytics/TopContentPanel';
import { trackAnalyticsEvent, useAnalyticsDashboard } from '@/hooks/useAnalytics';

const RANGES = [7, 14, 30, 90];
const MODULES = ['CONTENT', 'SOCIAL', 'VIDEO', 'MARKETING', 'PAYMENTS'] as const;

function formatDelta(current: number, previous: number) {
  const delta = current - previous;
  if (previous === 0) {
    return {
      delta,
      percent: current > 0 ? 100 : 0,
    };
  }

  return {
    delta,
    percent: (delta / previous) * 100,
  };
}

function formatSignedNumber(value: number, digits = 0) {
  const fixed = digits > 0 ? value.toFixed(digits) : Math.round(value).toString();
  return value > 0 ? `+${fixed}` : fixed;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [compareDays, setCompareDays] = useState(7);
  const [topContentQuery, setTopContentQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [activeModule, setActiveModule] = useState<(typeof MODULES)[number]>('CONTENT');
  const { dashboard, insights, intelligence, loading, error, reload } = useAnalyticsDashboard(days);
  const { dashboard: compareDashboard, loading: compareLoading } = useAnalyticsDashboard(compareDays);

  const filteredTopContent = dashboard?.topContent.filter((item) => {
    const query = topContentQuery.trim().toLowerCase();
    if (!query) return true;
    return item.title.toLowerCase().includes(query) || item.type.toLowerCase().includes(query);
  }) ?? [];

  const filteredRevenueAttribution = dashboard?.revenueAttribution.filter((item) => {
    if (sourceFilter === 'ALL') return true;
    return item.source === sourceFilter;
  }) ?? [];

  const activeModuleMetric = dashboard?.overview.moduleBreakdown.find((item) => item.module === activeModule) ?? null;
  const compareModuleMetric = compareDashboard?.overview.moduleBreakdown.find((item) => item.module === activeModule) ?? null;

  const comparisonCards = dashboard && compareDashboard ? [
    {
      label: 'Tracked Views',
      current: dashboard.overview.trackedViews,
      previous: compareDashboard.overview.trackedViews,
    },
    {
      label: 'Engagements',
      current: dashboard.overview.engagements,
      previous: compareDashboard.overview.engagements,
    },
    {
      label: 'Attributed Revenue',
      current: dashboard.overview.attributedRevenue,
      previous: compareDashboard.overview.attributedRevenue,
      currency: true,
    },
  ] : [];

  const availableSources = dashboard
    ? ['ALL', ...new Set(dashboard.revenueAttribution.map((item) => item.source))]
    : ['ALL'];

  const topCampaigns = intelligence?.campaignPerformance?.slice(0, 5) ?? [];
  const topChannels = intelligence?.channelPerformance?.slice(0, 5) ?? [];
  const churnRisks = intelligence?.aiInsights?.churn?.slice(0, 3) ?? [];

  const handleExport = async (format: 'json' | 'csv') => {
    if (!dashboard) return;

    const fileName = `analytics-${days}d.${format}`;
    const payload = format === 'json'
      ? JSON.stringify({ days, compareDays, dashboard, insights }, null, 2)
      : [
          ['date', 'views', 'engagements', 'revenue', 'attributedRevenue', 'conversions'].join(','),
          ...dashboard.performanceChart.map((item) => [
            item.date,
            item.views,
            item.engagements,
            item.revenue,
            item.attributedRevenue,
            item.conversions,
          ].join(',')),
        ].join('\n');

    const blob = new Blob([payload], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    trackAnalyticsEvent({
      eventType: 'analytics_dashboard_exported',
      entityType: 'ANALYTICS_DASHBOARD',
      entityId: `${days}d`,
      channel: 'ANALYTICS',
      source: 'APP',
      properties: { format, days, compareDays },
    });
  };

  const handleShare = async () => {
    if (!dashboard) return;

    const summary = `BelSuite analytics (${days}d): ${dashboard.overview.trackedViews.toLocaleString()} views, ${dashboard.overview.engagements.toLocaleString()} engagements, $${dashboard.overview.attributedRevenue.toLocaleString()} attributed revenue.`;

    if (navigator.share) {
      await navigator.share({
        title: 'BelSuite analytics snapshot',
        text: summary,
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
    }

    trackAnalyticsEvent({
      eventType: 'analytics_dashboard_shared',
      entityType: 'ANALYTICS_DASHBOARD',
      entityId: `${days}d`,
      channel: 'ANALYTICS',
      source: 'APP',
      properties: { days, compareDays },
    });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="border-b border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Advanced Analytics</h1>
              <p className="text-xs text-zinc-500">Performance tracking, attribution intelligence, and AI recommendations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {RANGES.map((value) => (
                <button
                  key={value}
                  onClick={() => setDays(value)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${days === value ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  {value}d
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
              <span className="text-zinc-500">Compare</span>
              <select
                value={compareDays}
                onChange={(event) => setCompareDays(Number(event.target.value))}
                className="bg-transparent text-white outline-none"
              >
                {RANGES.map((value) => (
                  <option key={value} value={value} className="bg-[#0D0D0D]">
                    {value}d
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={reload}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>

            <button
              onClick={() => void handleExport('csv')}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>

            <button
              onClick={() => void handleShare()}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {loading && !dashboard ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : dashboard ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {comparisonCards.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {comparisonCards.map((card) => {
                  const delta = formatDelta(card.current, card.previous);
                  return (
                    <div key={card.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
                          <p className="mt-3 text-3xl font-semibold text-white">
                            {card.currency
                              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(card.current)
                              : card.current.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">vs {compareDays}d comparison window</p>
                        </div>
                        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${delta.delta >= 0 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          {formatSignedNumber(delta.percent, 1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {intelligence ? (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <h2 className="text-base font-semibold text-white">Campaign Performance + ROI</h2>
                  <p className="mt-1 text-sm text-zinc-500">Track winning campaigns, profitability, and spend efficiency.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Spend</p>
                      <p className="mt-1 text-lg font-semibold text-white">${intelligence.roi.spend.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Campaign Revenue</p>
                      <p className="mt-1 text-lg font-semibold text-white">${intelligence.roi.campaignRevenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Net ROI</p>
                      <p className="mt-1 text-lg font-semibold text-white">{intelligence.roi.netROI}%</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Payback Signal</p>
                      <p className="mt-1 text-lg font-semibold capitalize text-white">{intelligence.roi.paybackSignal}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {topCampaigns.map((campaign) => (
                      <div key={campaign.campaignId} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm">
                        <span className="truncate text-zinc-200">{campaign.campaignName}</span>
                        <span className="text-zinc-400">ROI {campaign.roi}%</span>
                        <span className="text-zinc-400">ROAS {campaign.roas}</span>
                        <span className="text-zinc-500">CVR {campaign.cvr}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                    <h3 className="text-base font-semibold text-white">Lead Conversion Rate</h3>
                    <p className="mt-1 text-sm text-zinc-500">Lead-to-customer efficiency across tracked events.</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-zinc-500">Leads</p>
                        <p className="mt-1 text-lg font-semibold text-white">{intelligence.leadConversion.leads}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-zinc-500">Customers</p>
                        <p className="mt-1 text-lg font-semibold text-white">{intelligence.leadConversion.customers}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-zinc-500">Rate</p>
                        <p className="mt-1 text-lg font-semibold text-white">{intelligence.leadConversion.leadToCustomerRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                    <h3 className="text-base font-semibold text-white">Channel Performance</h3>
                    <div className="mt-3 space-y-2">
                      {topChannels.map((channel) => (
                        <div key={channel.channel} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm">
                          <span className="text-zinc-300">{channel.channel}</span>
                          <span className="text-zinc-500">${channel.revenue.toLocaleString()} · {channel.share}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {intelligence ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
                  <h3 className="text-base font-semibold text-emerald-300">What is Working / Not Working</h3>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/70">Working</p>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                        {intelligence.aiInsights.working.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-amber-300/80">Not Working</p>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                        {intelligence.aiInsights.notWorking.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-sky-300/80">Recommendations</p>
                    <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                      {intelligence.aiInsights.recommendations.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-5">
                  <h3 className="text-base font-semibold text-red-300">Predict Churn</h3>
                  <p className="mt-1 text-sm text-zinc-400">Risk segments based on billing health and conversion/revenue trend shifts.</p>
                  <div className="mt-4 space-y-2">
                    {churnRisks.map((risk, index) => (
                      <div key={`${risk.segment}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-200">{risk.segment}</p>
                          <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                            {risk.riskScore}/100
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{risk.reason}</p>
                        <p className="mt-2 text-xs text-zinc-300">{risk.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeModuleMetric ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white">Module Spotlight</h2>
                    <p className="text-sm text-zinc-500">Focus the dashboard on the operating area you want to review first.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MODULES.map((module) => (
                      <button
                        key={module}
                        onClick={() => setActiveModule(module)}
                        className={`rounded-full border px-3 py-1.5 text-xs tracking-[0.18em] transition-colors ${activeModule === module ? 'border-white bg-white text-black' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
                      >
                        {module}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{activeModule}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{activeModuleMetric.primaryValue.toLocaleString()}</p>
                    <p className="mt-1 text-sm text-zinc-400">{activeModuleMetric.primaryLabel}</p>
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <p className="text-lg font-medium text-white">{activeModuleMetric.secondaryValue.toLocaleString()}</p>
                      <p className="text-sm text-zinc-500">{activeModuleMetric.secondaryLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Comparison</p>
                    <p className="mt-3 text-sm text-zinc-400">
                      {compareLoading ? 'Loading comparison window...' : `Compared against the last ${compareDays} days.`}
                    </p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500">Primary metric delta</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {compareModuleMetric ? formatSignedNumber(activeModuleMetric.primaryValue - compareModuleMetric.primaryValue) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Secondary metric delta</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {compareModuleMetric ? formatSignedNumber(activeModuleMetric.secondaryValue - compareModuleMetric.secondaryValue) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <AnalyticsOverview overview={dashboard.overview} />
            <PerformanceCharts
              performanceChart={dashboard.performanceChart}
              byType={dashboard.engagementBreakdown.byType}
              byChannel={dashboard.engagementBreakdown.byChannel}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top Content Filter</label>
                <input
                  value={topContentQuery}
                  onChange={(event) => setTopContentQuery(event.target.value)}
                  placeholder="Search by title or content type"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
                />
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue Source Filter</label>
                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                >
                  {availableSources.map((source) => (
                    <option key={source} value={source} className="bg-[#0D0D0D]">
                      {source === 'ALL' ? 'All sources' : source}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <RevenueAttributionPanel items={filteredRevenueAttribution} />
              <AnalyticsInsightsPanel insights={insights} loading={loading} />
            </div>
            <TopContentPanel items={filteredTopContent} />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}