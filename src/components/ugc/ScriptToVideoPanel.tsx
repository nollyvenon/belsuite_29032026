'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Save, FileText, Bot, Mic2 } from 'lucide-react';
import { useUGCStudio } from '@/hooks/useUGC';

export function ScriptToVideoPanel({ projectId }: { projectId: string }) {
  const { project, loading, saving, generateScript, saveScript } = useUGCStudio(projectId);
  const [form, setForm] = useState({
    objective: 'conversions',
    platform: 'tiktok',
    durationSeconds: 30,
    productOrOffer: '',
    targetAudience: '',
    callToAction: '',
    talkingPoints: '',
  });
  const [draftScript, setDraftScript] = useState('');

  const parsedScenes = useMemo(() => {
    try {
      return project?.script?.scenesJson ? JSON.parse(project.script.scenesJson) as Array<{ order: number; line: string; visualDirection: string; durationSeconds: number }> : [];
    } catch {
      return [];
    }
  }, [project?.script?.scenesJson]);

  async function handleGenerate() {
    const result = await generateScript({
      objective: form.objective as any,
      platform: form.platform as any,
      durationSeconds: Number(form.durationSeconds),
      productOrOffer: form.productOrOffer,
      targetAudience: form.targetAudience,
      callToAction: form.callToAction || undefined,
      talkingPoints: form.talkingPoints.split('\n').map((item) => item.trim()).filter(Boolean),
    });
    if (result?.content) setDraftScript(result.content);
  }

  async function handleSave() {
    await saveScript(draftScript || project?.script?.content || '', project?.script?.scenesJson);
  }

  if (loading) {
    return <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-10 text-center text-zinc-500">Loading project...</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold"><Sparkles className="w-4 h-4 text-primary" /> Script Generator</div>
        <div className="space-y-4">
          <Field label="Objective"><select value={form.objective} onChange={(e) => setForm((s) => ({ ...s, objective: e.target.value }))} className="input"><option value="awareness">Awareness</option><option value="engagement">Engagement</option><option value="conversions">Conversions</option><option value="retention">Retention</option></select></Field>
          <Field label="Platform"><select value={form.platform} onChange={(e) => setForm((s) => ({ ...s, platform: e.target.value }))} className="input"><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option></select></Field>
          <Field label="Duration"><input type="number" min={15} max={180} value={form.durationSeconds} onChange={(e) => setForm((s) => ({ ...s, durationSeconds: Number(e.target.value) }))} className="input" /></Field>
          <Field label="Product / Offer"><input value={form.productOrOffer} onChange={(e) => setForm((s) => ({ ...s, productOrOffer: e.target.value }))} className="input" placeholder="Hydration powder sachets" /></Field>
          <Field label="Target Audience"><input value={form.targetAudience} onChange={(e) => setForm((s) => ({ ...s, targetAudience: e.target.value }))} className="input" placeholder="Busy professionals who want more energy" /></Field>
          <Field label="Call To Action"><input value={form.callToAction} onChange={(e) => setForm((s) => ({ ...s, callToAction: e.target.value }))} className="input" placeholder="Use BEL10 for your first order" /></Field>
          <Field label="Talking Points"><textarea value={form.talkingPoints} onChange={(e) => setForm((s) => ({ ...s, talkingPoints: e.target.value }))} className="input min-h-[120px]" placeholder={'Real ingredients\nFast prep\nNo sugar crash'} /></Field>
          <button onClick={handleGenerate} disabled={saving || !form.productOrOffer || !form.targetAudience} className="w-full rounded-xl bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? 'Generating...' : 'Generate UGC script'}</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Script Workspace</h3>
              <p className="text-sm text-zinc-500">Edit the AI draft before sending it to avatar rendering.</p>
            </div>
            <button onClick={handleSave} disabled={saving || !(draftScript || project?.script?.content)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50">
              <Save className="w-4 h-4" /> Save script
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500"><Bot className="w-3.5 h-3.5" /> Avatar</div>
              <p className="mt-2 text-sm text-white">{project?.avatar?.name ?? 'No avatar selected'}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500"><Mic2 className="w-3.5 h-3.5" /> Voice</div>
              <p className="mt-2 text-sm text-white">{project?.voiceClone?.name ?? 'No voice clone selected'}</p>
            </div>
          </div>

          <textarea
            value={draftScript || project?.script?.content || ''}
            onChange={(e) => setDraftScript(e.target.value)}
            className="input min-h-[280px] font-medium leading-7"
            placeholder="Generate a script or paste one here..."
          />

          {project?.script && (
            <div className="mt-3 text-xs text-zinc-500 flex items-center gap-3">
              <span>Version {project.script.version}</span>
              <span>•</span>
              <span>{project.script.wordCount ?? 0} words</span>
              <span>•</span>
              <span>{project.script.estimatedSecs ?? project.durationSeconds ?? 0} sec estimate</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4 text-white font-semibold"><FileText className="w-4 h-4 text-primary" /> Scene Breakdown</div>
          <div className="space-y-3">
            {parsedScenes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">Generate a script to produce scene-by-scene direction.</div>
            ) : (
              parsedScenes.map((scene) => (
                <div key={scene.order} className="rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Scene {scene.order}</p>
                    <span className="text-xs text-zinc-500">{scene.durationSeconds}s</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{scene.line}</p>
                  <p className="mt-3 text-xs text-zinc-500">{scene.visualDirection}</p>
                </div>
              ))
            )}
          </div>
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