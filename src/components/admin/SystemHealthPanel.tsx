'use client';

import { type EmailProviderConfig } from '@/lib/api/modules/admin';
import { StatusBadge } from '@/components/system/StatusBadge';

function prettyValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return 'Unavailable';
}

export function SystemHealthPanel({
  providers,
  health,
}: {
  providers: EmailProviderConfig[];
  health: Record<string, unknown> | null;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[28px] border border-white/5 bg-black/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Provider catalog</h3>
            <p className="mt-1 text-sm text-slate-500">Available email transports configured for this stack.</p>
          </div>
          <StatusBadge tone="focus">live</StatusBadge>
        </div>
        <div className="mt-4 space-y-3">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{provider.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{provider.description}</p>
                </div>
                <span className="text-xs text-slate-400">{provider.maxEmailsPerSecond}/sec</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/5 bg-black/20 p-5">
        <h3 className="text-base font-semibold text-white">Operational health</h3>
        <p className="mt-1 text-sm text-slate-500">Direct rendering of the backend health response for admin review.</p>
        <div className="mt-4 space-y-3">
          {health ? (
            Object.entries(health).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{prettyValue(value)}</pre>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">Health data is not available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}