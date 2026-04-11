'use client';

import { useState } from 'react';
import type { IntegrationRetryPolicy } from '@/lib/api/modules/admin';

type Props = {
  policy: IntegrationRetryPolicy | null;
  onSave: (payload: IntegrationRetryPolicy) => Promise<unknown>;
  saving?: boolean;
};

export function RetryPolicyPanel({ policy, onSave, saving }: Props) {
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [maxAttempts, setMaxAttempts] = useState(String(policy?.maxAttempts ?? 5));
  const [retryDelayMs, setRetryDelayMs] = useState(String(policy?.retryDelayMs ?? 5000));
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enable automatic retries
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} type="number" min={1} max={10} />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={retryDelayMs} onChange={(e) => setRetryDelayMs(e.target.value)} type="number" min={1000} max={60000} />
      </div>
      <button
        className="rounded-lg bg-violet-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        disabled={saving}
        onClick={async () => {
          setError(null);
          try {
            await onSave({
              enabled,
              maxAttempts: Number(maxAttempts),
              retryDelayMs: Number(retryDelayMs),
              retryableStatuses: ['FAILED', 'RETRYING'],
            });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        Save retry policy
      </button>
      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
