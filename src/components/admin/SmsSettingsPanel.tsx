'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { type AdminSmsSettings, type SmsProviderConfig } from '@/lib/api/modules/admin';

export function SmsSettingsPanel({
  settings,
  providers,
  saving,
  onSave,
}: {
  settings: AdminSmsSettings | null;
  providers: SmsProviderConfig[];
  saving: boolean;
  onSave: (payload: Partial<AdminSmsSettings>) => Promise<unknown>;
}) {
  const initialState = useMemo(
    () => ({
      provider: settings?.provider ?? 'TWILIO',
      enabled: settings?.enabled ?? false,
      twilioAccountSid: settings?.twilioAccountSid ?? '',
      twilioAuthToken: settings?.twilioAuthToken ?? '',
      twilioFromNumber: settings?.twilioFromNumber ?? '',
      vonageApiKey: settings?.vonageApiKey ?? '',
      vonageApiSecret: settings?.vonageApiSecret ?? '',
      vonageFromNumber: settings?.vonageFromNumber ?? '',
      awsRegion: settings?.awsRegion ?? 'us-east-1',
      awsAccessKeyId: settings?.awsAccessKeyId ?? '',
      awsSecretAccessKey: settings?.awsSecretAccessKey ?? '',
    }),
    [settings],
  );
  const [form, setForm] = useState(initialState);
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary SMS provider</span>
          <select value={form.provider} onChange={(e) => setField('provider', e.target.value as any)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id} className="bg-slate-950">{provider.name}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setField('enabled', !form.enabled)}
          className={`mt-6 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${form.enabled ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
        >
          SMS {form.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input placeholder="Twilio SID" value={form.twilioAccountSid} onChange={(e) => setField('twilioAccountSid', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="Twilio Auth Token" value={form.twilioAuthToken} onChange={(e) => setField('twilioAuthToken', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="Twilio From Number" value={form.twilioFromNumber} onChange={(e) => setField('twilioFromNumber', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="Vonage API Key" value={form.vonageApiKey} onChange={(e) => setField('vonageApiKey', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="Vonage API Secret" value={form.vonageApiSecret} onChange={(e) => setField('vonageApiSecret', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="Vonage From" value={form.vonageFromNumber} onChange={(e) => setField('vonageFromNumber', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="AWS Region" value={form.awsRegion} onChange={(e) => setField('awsRegion', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="AWS Access Key" value={form.awsAccessKeyId} onChange={(e) => setField('awsAccessKeyId', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <input placeholder="AWS Secret Key" value={form.awsSecretAccessKey} onChange={(e) => setField('awsSecretAccessKey', e.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
      </div>

      <button
        onClick={() => void onSave(form)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save SMS settings
      </button>
    </div>
  );
}
