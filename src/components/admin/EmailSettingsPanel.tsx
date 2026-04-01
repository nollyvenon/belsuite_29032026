'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { type AdminEmailSettings, type EmailProviderConfig } from '@/lib/api/modules/admin';

export function EmailSettingsPanel({
  settings,
  providers,
  saving,
  onSave,
}: {
  settings: AdminEmailSettings | null;
  providers: EmailProviderConfig[];
  saving: boolean;
  onSave: (payload: Partial<AdminEmailSettings>) => Promise<unknown>;
}) {
  const initialState = useMemo(
    () => ({
      primaryProvider: settings?.primaryProvider ?? 'sendgrid',
      emailFrom: settings?.emailFrom ?? 'noreply@belsuite.com',
      emailFromName: settings?.emailFromName ?? 'Belsuite',
      replyTo: settings?.replyTo ?? '',
      enableFailover: settings?.enableFailover ?? true,
      fallbackProviders: (settings?.fallbackProviders ?? ['mailgun', 'ses', 'postmark']).join(', '),
      maxRetries: settings?.maxRetries ?? 3,
      retryDelayMs: settings?.retryDelayMs ?? 5000,
      rateLimitPerMinute: settings?.rateLimitPerMinute ?? 100,
      rateLimitPerHour: settings?.rateLimitPerHour ?? 10000,
      trackingEnabled: settings?.trackingEnabled ?? true,
      webhooksEnabled: settings?.webhooksEnabled ?? true,
      attachmentsEnabled: settings?.attachmentsEnabled ?? true,
    }),
    [settings],
  );

  const [form, setForm] = useState(initialState);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary provider</span>
          <select value={form.primaryProvider} onChange={(event) => setField('primaryProvider', event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id} className="bg-slate-950">{provider.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">From address</span>
          <input value={form.emailFrom} onChange={(event) => setField('emailFrom', event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">From name</span>
          <input value={form.emailFromName} onChange={(event) => setField('emailFromName', event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>

        <label className="block md:col-span-2 xl:col-span-3">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Fallback providers</span>
          <input value={form.fallbackProviders} onChange={(event) => setField('fallbackProviders', event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Max retries</span>
          <input type="number" value={form.maxRetries} onChange={(event) => setField('maxRetries', Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Retry delay (ms)</span>
          <input type="number" value={form.retryDelayMs} onChange={(event) => setField('retryDelayMs', Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Per-minute limit</span>
          <input type="number" value={form.rateLimitPerMinute} onChange={(event) => setField('rateLimitPerMinute', Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['Enable failover', 'enableFailover'],
          ['Tracking enabled', 'trackingEnabled'],
          ['Webhooks enabled', 'webhooksEnabled'],
          ['Attachments enabled', 'attachmentsEnabled'],
        ].map(([label, key]) => (
          <button
            key={key}
            onClick={() => setField(key as keyof typeof form, !form[key as keyof typeof form] as never)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${form[key as keyof typeof form] ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => void onSave({
          primaryProvider: form.primaryProvider,
          emailFrom: form.emailFrom,
          emailFromName: form.emailFromName,
          replyTo: form.replyTo || undefined,
          enableFailover: form.enableFailover,
          fallbackProviders: form.fallbackProviders.split(',').map((item) => item.trim()).filter(Boolean),
          maxRetries: form.maxRetries,
          retryDelayMs: form.retryDelayMs,
          rateLimitPerMinute: form.rateLimitPerMinute,
          rateLimitPerHour: form.rateLimitPerHour,
          trackingEnabled: form.trackingEnabled,
          webhooksEnabled: form.webhooksEnabled,
          attachmentsEnabled: form.attachmentsEnabled,
        })}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save email settings
      </button>
    </div>
  );
}