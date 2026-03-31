'use client';

import { useState } from 'react';
import { Bot, Plus, Wand2 } from 'lucide-react';
import { useUGCAvatars } from '@/hooks/useUGC';

const STYLES = ['INFLUENCER', 'PROFESSIONAL', 'CASUAL', 'PRESENTER', 'NARRATOR'] as const;
const PROVIDERS = ['HEYGEN', 'DID', 'TAVUS', 'SYNTHESIA', 'MOCK'] as const;

export function AvatarStudio() {
  const { avatars, loading, createAvatar } = useUGCAvatars();
  const [form, setForm] = useState({
    name: '',
    style: 'INFLUENCER',
    provider: 'MOCK',
    description: '',
    thumbnailUrl: '',
    ageRange: '',
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createAvatar({
      name: form.name,
      style: form.style as any,
      provider: form.provider as any,
      description: form.description || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      ageRange: form.ageRange || undefined,
    });
    setForm({ name: '', style: 'INFLUENCER', provider: 'MOCK', description: '', thumbnailUrl: '', ageRange: '' });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold"><Plus className="w-4 h-4 text-primary" /> Create Avatar</div>
        <div className="space-y-4">
          <Field label="Avatar Name"><input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="input" placeholder="Mia Creator" /></Field>
          <Field label="Style"><select value={form.style} onChange={(e) => setForm((s) => ({ ...s, style: e.target.value }))} className="input">{STYLES.map((style) => <option key={style} value={style}>{style}</option>)}</select></Field>
          <Field label="Provider"><select value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} className="input">{PROVIDERS.map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></Field>
          <Field label="Thumbnail URL"><input value={form.thumbnailUrl} onChange={(e) => setForm((s) => ({ ...s, thumbnailUrl: e.target.value }))} className="input" placeholder="https://..." /></Field>
          <Field label="Age Range"><input value={form.ageRange} onChange={(e) => setForm((s) => ({ ...s, ageRange: e.target.value }))} className="input" placeholder="25-35" /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="input min-h-[96px]" placeholder="Confident, warm creator who feels native to short-form lifestyle ads" /></Field>
          <button onClick={handleCreate} className="w-full rounded-xl bg-primary text-white py-2.5 text-sm font-semibold">Save Avatar</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Avatar Library</h3>
            <p className="text-sm text-zinc-500">Blend built-in realism presets with your own custom personas.</p>
          </div>
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(loading ? [] : avatars).map((avatar) => (
            <div key={avatar.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center mb-4">
                {avatar.thumbnailUrl ? (
                  <img src={avatar.thumbnailUrl} alt={avatar.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-8 h-8 text-zinc-700" />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{avatar.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{avatar.style} • {avatar.provider}</p>
                </div>
                {avatar.isSystem && <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-400">System</span>}
              </div>
              <p className="text-xs text-zinc-500 mt-3">{avatar.description || 'No description provided.'}</p>
            </div>
          ))}

          {!loading && avatars.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-zinc-500 md:col-span-2">
              No avatars available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}