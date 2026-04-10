'use client';

import { useMemo, useState } from 'react';
import type { CampaignChannelRoute } from '@/lib/api/modules/admin';

type Props = {
  routes: CampaignChannelRoute[];
  saving?: boolean;
  onSave: (payload: CampaignChannelRoute) => Promise<unknown>;
  onDelete: (objective: CampaignChannelRoute['objective']) => Promise<unknown>;
};

const OBJECTIVES: CampaignChannelRoute['objective'][] = ['awareness', 'engagement', 'conversion', 'retention'];
const CHANNELS: CampaignChannelRoute['channel'][] = ['email', 'sms', 'whatsapp', 'voice', 'ai_voice_agent'];
const PROVIDERS = ['sendgrid', 'mailgun', 'postmark', 'ses', 'smtp', 'TWILIO', 'VONAGE', 'AWS_SNS', 'whatsapp', 'twilio_voice'];

export function CampaignChannelsPanel({ routes, saving, onSave, onDelete }: Props) {
  const byObjective = useMemo(() => {
    const map = new Map<string, CampaignChannelRoute>();
    routes.forEach((r) => map.set(r.objective, r));
    return map;
  }, [routes]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {OBJECTIVES.map((objective) => {
        const route = byObjective.get(objective) ?? { objective, channel: 'email', provider: 'sendgrid' };
        return (
          <div key={objective} className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-4">
            <div className="flex items-center text-sm font-medium capitalize text-slate-200">{objective}</div>
            <select
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
              value={route.channel}
              onChange={async (e) => {
                setError(null);
                try {
                  await onSave({ ...route, channel: e.target.value as CampaignChannelRoute['channel'] });
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
              disabled={saving}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
              value={route.provider}
              onChange={async (e) => {
                setError(null);
                try {
                  await onSave({ ...route, provider: e.target.value });
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
              disabled={saving}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              onClick={async () => {
                setError(null);
                try {
                  await onDelete(objective);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
              disabled={saving}
            >
              Clear Route
            </button>
          </div>
        );
      })}
      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
