'use client';

import { motion } from 'motion/react';
import { Activity, Eye, HandHeart, DollarSign, Target, LayoutPanelTop } from 'lucide-react';
import type { AnalyticsOverview as AnalyticsOverviewData } from '@/hooks/useAnalytics';

const MODULE_LABELS: Record<string, string> = {
  CONTENT: 'Content',
  SOCIAL: 'Social',
  VIDEO: 'Video',
  MARKETING: 'Marketing',
  PAYMENTS: 'Payments',
};

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AnalyticsOverview({ overview }: { overview: AnalyticsOverviewData }) {
  const stats = [
    { label: 'Tracked Views', value: overview.trackedViews.toLocaleString(), Icon: Eye },
    { label: 'Engagements', value: overview.engagements.toLocaleString(), Icon: HandHeart },
    { label: 'Engagement Rate', value: `${overview.engagementRate}%`, Icon: Activity },
    { label: 'Attributed Revenue', value: fmtCurrency(overview.attributedRevenue), Icon: DollarSign },
    { label: 'Conversions', value: overview.conversions.toLocaleString(), Icon: Target },
    { label: 'Total Events', value: overview.totalEvents.toLocaleString(), Icon: LayoutPanelTop },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, Icon }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">Module Breakdown</h3>
            <p className="text-sm text-zinc-500">Cross-product visibility across content, social, video, marketing, and payments.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {overview.moduleBreakdown.map((item) => (
            <div key={item.module} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{MODULE_LABELS[item.module] ?? item.module}</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {item.primaryLabel.toLowerCase().includes('revenue') ? fmtCurrency(item.primaryValue) : item.primaryValue.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{item.primaryLabel}</p>
              <div className="mt-4 border-t border-white/5 pt-4">
                <p className="text-sm text-zinc-300">
                  {item.secondaryLabel.toLowerCase().includes('revenue') ? fmtCurrency(item.secondaryValue) : item.secondaryValue.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">{item.secondaryLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}