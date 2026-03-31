'use client';

import { useState } from 'react';
import { Mic2, AudioWaveform } from 'lucide-react';
import { useVoiceClones } from '@/hooks/useUGC';

export function VoiceClonesPanel() {
  const { voiceClones, loading, createVoiceClone } = useVoiceClones();
  const [form, setForm] = useState({
    name: '',
    provider: 'elevenlabs',
    language: 'en',
    accent: '',
    sampleAudioUrl: '',
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createVoiceClone({
      name: form.name,
      provider: form.provider,
      language: form.language,
      accent: form.accent || undefined,
      sampleAudioUrl: form.sampleAudioUrl || undefined,
    });
    setForm({ name: '', provider: 'elevenlabs', language: 'en', accent: '', sampleAudioUrl: '' });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold"><Mic2 className="w-4 h-4 text-primary" /> Voice Clone Setup</div>
        <div className="space-y-4">
          <Field label="Voice Name"><input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="input" placeholder="Founder Voice" /></Field>
          <Field label="Provider"><input value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} className="input" placeholder="elevenlabs" /></Field>
          <Field label="Language"><input value={form.language} onChange={(e) => setForm((s) => ({ ...s, language: e.target.value }))} className="input" placeholder="en" /></Field>
          <Field label="Accent"><input value={form.accent} onChange={(e) => setForm((s) => ({ ...s, accent: e.target.value }))} className="input" placeholder="US neutral" /></Field>
          <Field label="Sample Audio URL"><input value={form.sampleAudioUrl} onChange={(e) => setForm((s) => ({ ...s, sampleAudioUrl: e.target.value }))} className="input" placeholder="https://..." /></Field>
          <button onClick={handleCreate} className="w-full rounded-xl bg-primary text-white py-2.5 text-sm font-semibold">Create Voice Clone</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Voice Library</h3>
            <p className="text-sm text-zinc-500">Store reusable cloned voices with tunable realism controls.</p>
          </div>
          <AudioWaveform className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-3">
          {(loading ? [] : voiceClones).map((clone) => (
            <div key={clone.id} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{clone.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{clone.provider} • {clone.language}{clone.accent ? ` • ${clone.accent}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                {clone.isDefault && <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Default</span>}
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/5">Stability {Math.round(clone.stability * 100)}%</span>
              </div>
            </div>
          ))}

          {!loading && voiceClones.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-zinc-500">
              No voice clones yet.
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