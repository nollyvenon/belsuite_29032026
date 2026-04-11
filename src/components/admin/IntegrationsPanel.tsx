'use client';

import { useState } from 'react';
import type { IntegrationConnection, IntegrationEventLog } from '@/lib/api/modules/admin';

type Props = {
  integrations: IntegrationConnection[];
  events: IntegrationEventLog[];
  onSendSlack: (payload: { channel: string; text: string; blocks?: unknown[] }) => Promise<unknown>;
  onTriggerZapier: (payload: { hookName: string; payload: Record<string, unknown> }) => Promise<unknown>;
  onFireEvent: (payload: { eventType: string; payload: Record<string, unknown>; channels: Array<{ provider: string; connectionId?: string | null; channel?: string | null }> }) => Promise<unknown>;
  saving?: boolean;
};

export function IntegrationsPanel({ integrations, events, onSendSlack, onTriggerZapier, onFireEvent, saving }: Props) {
  const [channel, setChannel] = useState('#alerts');
  const [text, setText] = useState('Belsuite integration test message');
  const [hookName, setHookName] = useState('lead.created');
  const [eventType, setEventType] = useState('lead.created');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-medium text-slate-100">Slack notification</div>
          <input className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="#alerts" />
          <textarea className="mb-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={text} onChange={(e) => setText(e.target.value)} />
          <button
            className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            disabled={saving}
            onClick={async () => {
              setError(null);
              try {
                await onSendSlack({ channel, text });
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Send to Slack
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-medium text-slate-100">Zapier connector</div>
          <input className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={hookName} onChange={(e) => setHookName(e.target.value)} placeholder="lead.created" />
          <button
            className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            disabled={saving}
            onClick={async () => {
              setError(null);
              try {
                await onTriggerZapier({ hookName, payload: { source: 'admin-panel' } });
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Trigger connector
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-medium text-slate-100">Fanout test event</div>
          <input className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="lead.created" />
          <button
            className="rounded-lg bg-violet-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            disabled={saving}
            onClick={async () => {
              setError(null);
              try {
                await onFireEvent({
                  eventType,
                  payload: { source: 'admin-panel', message: text },
                  channels: [
                    { provider: 'SLACK', channel },
                    { provider: 'ZAPIER' },
                  ],
                });
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Fire integration event
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-medium text-slate-100">Connected integrations</div>
          <div className="space-y-2 text-xs text-slate-300">
            {integrations.length === 0 ? (
              <div>No active connections found.</div>
            ) : (
              integrations.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="font-medium text-slate-100">{item.provider}</div>
                  <div>{item.accountName ?? item.accountEmail ?? item.accountId ?? 'Connected account'}</div>
                  <div>Status: {item.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-medium text-slate-100">Recent integration events</div>
          <div className="space-y-2 text-xs text-slate-300">
            {events.length === 0 ? (
              <div>No recent integration events.</div>
            ) : (
              events.slice(0, 8).map((event, index) => (
                <div key={`${event.provider}-${event.eventType}-${index}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="font-medium text-slate-100">{event.provider} / {event.eventType}</div>
                  <div>Attempts: {String(event.attempts ?? 0)}</div>
                  <div>Status: {event.status ?? 'logged'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
