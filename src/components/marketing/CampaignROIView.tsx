'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  DollarSign,
  MousePointer,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { useCampaignROI } from '@/hooks/useMarketing';

interface Props {
  campaignId: string;
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

const RANGE_OPTIONS = [7, 14, 30, 60, 90] as const;

export function CampaignROIView({ campaignId }: Props) {
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const { data, loading, error, load } = useCampaignROI(campaignId, days);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm py-8 justify-center">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { totals, efficiency, budget, recommendations } = data;

  const stats = [
    { label: 'Spend', value: fmtCurrency(totals.spend), Icon: DollarSign, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Revenue', value: fmtCurrency(totals.revenue), Icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'ROAS', value: `${efficiency.roas.toFixed(2)}x`, Icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'ROI', value: fmtPct(efficiency.roi), Icon: TrendingUp, color: efficiency.roi >= 0 ? 'text-emerald-400' : 'text-red-400', bg: efficiency.roi >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10' },
    { label: 'Conversions', value: totals.conversions.toLocaleString(), Icon: Target, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'Clicks', value: totals.clicks.toLocaleString(), Icon: MousePointer, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const efficiencyRows = [
    { label: 'CTR', value: fmtPct(efficiency.ctr * 100), note: 'Click-through rate' },
    { label: 'CVR', value: fmtPct(efficiency.cvr * 100), note: 'Conversion rate' },
    { label: 'CPA', value: efficiency.cpa > 0 ? fmtCurrency(efficiency.cpa) : '—', note: 'Cost per acquisition' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">{data.name}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Objective: <span className="text-zinc-400">{data.objective}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          {RANGE_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-primary text-white'
                  : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Efficiency metrics and Budget side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Efficiency</h3>
          <div className="space-y-3">
            {efficiencyRows.map(({ label, value, note }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-[11px] text-zinc-600">{note}</p>
                </div>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Budget</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Daily budget</p>
              <p className="text-sm font-semibold text-white">
                {budget.dailyBudget != null ? fmtCurrency(budget.dailyBudget) : '—'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Total budget</p>
              <p className="text-sm font-semibold text-white">
                {budget.totalBudget != null ? fmtCurrency(budget.totalBudget) : '—'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Spend ({days}d)</p>
              <p className="text-sm font-semibold text-white">{fmtCurrency(totals.spend)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
