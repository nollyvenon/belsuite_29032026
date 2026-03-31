'use client';

import { motion } from 'motion/react';
import {
  TrendingUp,
  DollarSign,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import type { DashboardOverview } from '@/hooks/useMarketing';

interface Props {
  overview: DashboardOverview;
}

function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

const TOP_STATS = [
  {
    key: 'totalSpend' as keyof DashboardOverview,
    label: 'Total Spend',
    Icon: DollarSign,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    key: 'totalRevenue' as keyof DashboardOverview,
    label: 'Total Revenue',
    Icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    key: 'avgROAS' as keyof DashboardOverview,
    label: 'Avg ROAS',
    Icon: BarChart3,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    formatter: (v: number) => `${v.toFixed(2)}x`,
  },
  {
    key: 'totalConversions' as keyof DashboardOverview,
    label: 'Conversions',
    Icon: Target,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    formatter: (v: number) => fmt(v),
  },
  {
    key: 'totalImpressions' as keyof DashboardOverview,
    label: 'Impressions',
    Icon: Eye,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    formatter: (v: number) => fmt(v),
  },
  {
    key: 'activeCampaigns' as keyof DashboardOverview,
    label: 'Active Campaigns',
    Icon: MousePointer,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    formatter: (v: number) => String(v),
  },
];

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
  if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-zinc-500" />;
}

export function MarketingDashboard({ overview }: Props) {
  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {TOP_STATS.map(({ key, label, Icon, color, bg, formatter }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white/[0.03] border border-white/5 rounded-xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-white">
              {formatter(overview[key] as number)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Campaign table */}
        <div className="xl:col-span-2 bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Campaigns Performance</h3>
          </div>
          {overview.campaigns.length === 0 ? (
            <div className="px-5 py-10 text-center text-zinc-500 text-sm">
              No campaign data yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Campaign', 'Status', 'Spend', 'Revenue', 'ROAS', 'CTR', 'Conversions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs text-zinc-500 font-medium whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {overview.campaigns.map((c) => (
                    <tr
                      key={c.campaignId}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <TrendIcon trend={c.trend} />
                          <span className="text-white font-medium truncate max-w-[140px]">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-400/10 text-emerald-400'
                              : c.status === 'PAUSED'
                              ? 'bg-amber-400/10 text-amber-400'
                              : 'bg-zinc-700/50 text-zinc-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{fmtCurrency(c.spend)}</td>
                      <td className="px-5 py-3 text-emerald-400">{fmtCurrency(c.revenue)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            c.roas >= 4
                              ? 'text-emerald-400 font-semibold'
                              : c.roas >= 2
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {c.roas.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{fmtPct(c.ctr)}</td>
                      <td className="px-5 py-3 text-zinc-300">{fmt(c.conversions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Top ads */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Top Performing Ads</h3>
            {overview.topAds.length === 0 ? (
              <p className="text-xs text-zinc-500">No ad data yet.</p>
            ) : (
              <div className="space-y-3">
                {overview.topAds.map((ad, i) => (
                  <div key={ad.adId} className="flex items-start gap-3">
                    <span className="text-xs text-zinc-600 font-mono w-4 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{ad.adName}</p>
                      <p className="text-xs text-zinc-500 truncate">{ad.campaignName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-violet-400">
                        {ad.roas.toFixed(2)}x
                      </p>
                      <p className="text-xs text-zinc-500">{fmtPct(ad.ctr)} CTR</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent conversions */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Conversions</h3>
            {overview.recentConversions.length === 0 ? (
              <p className="text-xs text-zinc-500">No conversions yet.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentConversions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-xs text-zinc-400 capitalize truncate">
                        {c.eventType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      {c.value ? (
                        <span className="text-xs text-emerald-400 font-medium">
                          {fmtCurrency(c.value)}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spend by platform */}
          {Object.keys(overview.spendByPlatform).length > 0 && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Spend by Platform</h3>
              <div className="space-y-2">
                {(Object.entries(overview.spendByPlatform) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, spend]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{platform}</span>
                      <span className="text-xs text-white font-medium">
                        {fmtCurrency(spend)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
