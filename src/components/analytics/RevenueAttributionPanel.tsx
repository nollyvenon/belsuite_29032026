'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import type { RevenueAttributionRow } from '@/hooks/useAnalytics';

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueAttributionPanel({ items }: { items: RevenueAttributionRow[] }) {
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 1);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Revenue Attribution</h3>
          <p className="text-sm text-zinc-500">See which sources and campaigns are producing revenue, not just traffic.</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/5">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
            No attributed revenue yet.
          </div>
        ) : (
          items.map((item) => (
            <div key={`${item.source}-${item.medium ?? 'na'}-${item.campaign ?? 'na'}`} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{item.source}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.medium ?? 'organic'}{item.campaign ? ` · ${item.campaign}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{fmtCurrency(item.revenue)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.conversions} conversions · {item.percentage}%</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(item.revenue / maxRevenue) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2 text-white mb-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Attribution notes
        </div>
        Revenue here is tied to conversion events with UTM context, so it highlights what actually closes rather than what only attracts clicks.
      </div>
    </div>
  );
}