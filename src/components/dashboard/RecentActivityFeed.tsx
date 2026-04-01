'use client';

import { type WorkspaceActivityItem } from '@/lib/api/modules/workspace';

export function RecentActivityFeed({ items }: { items: WorkspaceActivityItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-4">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{item.summary}</p>
        </div>
      ))}
    </div>
  );
}