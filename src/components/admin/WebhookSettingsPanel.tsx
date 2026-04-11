'use client';

import { useState } from 'react';
import type { IntegrationWebhookConfig } from '@/lib/api/modules/admin';

type Props = {
  webhooks: IntegrationWebhookConfig[];
  onSave: (payload: IntegrationWebhookConfig) => Promise<unknown>;
  saving?: boolean;
};

export function WebhookSettingsPanel({ webhooks, onSave, saving }: Props) {
  const [provider, setProvider] = useState('SLACK');
  const [targetUrl, setTargetUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [notes, setNotes] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="SLACK">Slack</option>
          <option value="ZAPIER">Zapier</option>
          <option value="EMAIL_SENDGRID">SendGrid Webhook</option>
          <option value="EMAIL_MAILGUN">Mailgun Webhook</option>
          <option value="EMAIL_POSTMARK">Postmark Webhook</option>
          <option value="EMAIL_SES">SES Webhook</option>
          <option value="EMAIL_SMTP">SMTP Webhook</option>
          <option value="SMS_TWILIO">Twilio Webhook</option>
          <option value="SMS_AFRICAS_TALKING">Africas Talking Webhook</option>
        </select>
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://hooks.example.com/..." />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Optional shared secret" />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>

      <button
        className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        disabled={saving}
        onClick={async () => {
          setError(null);
          try {
            await onSave({ provider, enabled, targetUrl, secret, notes });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        Save webhook config
      </button>

      <div className="space-y-2">
        {webhooks.length === 0 ? (
          <div className="text-xs text-slate-400">No webhook configs saved yet.</div>
        ) : (
          webhooks.map((item, index) => (
            <div key={`${item.provider}-${index}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
              <div className="font-medium text-slate-100">{item.provider}</div>
              <div>{item.targetUrl ?? 'No URL set'}</div>
            </div>
          ))
        )}
      </div>

      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
