'use client';

import { Sparkles } from 'lucide-react';
import type { TopContentItem } from '@/hooks/useAnalytics';

export function TopContentPanel({ items }: { items: TopContentItem[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Top Content</h3>
          <p className="text-sm text-zinc-500">What is actually pulling attention and interaction right now.</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">No content performance data yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.type} · {item.status}</p>
                </div>
                <div className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                  Score {item.score}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-zinc-500">Views</p>
                  <p className="mt-1 font-semibold text-white">{item.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Engagements</p>
                  <p className="mt-1 font-semibold text-white">{item.engagements.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Engagement Rate</p>
                  <p className="mt-1 font-semibold text-white">{item.engagementRate}%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}