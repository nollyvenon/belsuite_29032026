'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Plus, Trash2, Sparkles, Clock4, Layers3 } from 'lucide-react';
import { useUGCAvatars, useUGCProjects, useVoiceClones } from '@/hooks/useUGC';

export function UGCProjectsView() {
  const { projects, loading, createProject, deleteProject } = useUGCProjects();
  const { avatars } = useUGCAvatars();
  const { voiceClones } = useVoiceClones();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    avatarId: '',
    voiceCloneId: '',
    aspectRatio: '9:16',
    durationSeconds: 30,
    platform: 'tiktok',
  });

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await createProject({
        title: form.title,
        description: form.description || undefined,
        avatarId: form.avatarId || undefined,
        voiceCloneId: form.voiceCloneId || undefined,
        aspectRatio: form.aspectRatio,
        durationSeconds: form.durationSeconds,
        platform: form.platform,
      });
      setForm({
        title: '',
        description: '',
        avatarId: '',
        voiceCloneId: '',
        aspectRatio: '9:16',
        durationSeconds: 30,
        platform: 'tiktok',
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">UGC Projects</h2>
          <p className="text-sm text-zinc-500">Build creator-style videos with reusable avatar, voice, and script state.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New UGC Project
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-10 text-center text-zinc-500">Loading projects...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white truncate">{project.title}</p>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2 min-h-[40px]">{project.description || 'No description yet.'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/5 text-zinc-300">
                  {project.status}
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm text-zinc-400">
                <div className="flex items-center gap-2"><Film className="w-4 h-4 text-zinc-600" /> {project.platform ?? 'Platform not set'}</div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-zinc-600" /> {project.avatar?.name ?? 'No avatar selected'}</div>
                <div className="flex items-center gap-2"><Layers3 className="w-4 h-4 text-zinc-600" /> {project.voiceClone?.name ?? 'No voice clone selected'}</div>
                <div className="flex items-center gap-2"><Clock4 className="w-4 h-4 text-zinc-600" /> {project.durationSeconds ?? '—'} sec • {project.aspectRatio}</div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-600">Updated {new Date(project.updatedAt).toLocaleDateString()}</div>
                <button
                  onClick={async () => {
                    await deleteProject(project.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))}

          {projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-zinc-500 lg:col-span-2 xl:col-span-3">
              No UGC projects yet.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white">Create UGC Project</h3>
              <p className="text-sm text-zinc-500 mt-1">Seed the project with the avatar, voice, and delivery format you want the AI to use.</p>

              <div className="grid gap-4 md:grid-cols-2 mt-6">
                <Field label="Title">
                  <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="input" placeholder="New product reaction ad" />
                </Field>
                <Field label="Platform">
                  <select value={form.platform} onChange={(e) => setForm((s) => ({ ...s, platform: e.target.value }))} className="input">
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram Reels</option>
                    <option value="youtube">YouTube Shorts</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </Field>
                <Field label="Avatar">
                  <select value={form.avatarId} onChange={(e) => setForm((s) => ({ ...s, avatarId: e.target.value }))} className="input">
                    <option value="">No avatar yet</option>
                    {avatars.map((avatar) => <option key={avatar.id} value={avatar.id}>{avatar.name}</option>)}
                  </select>
                </Field>
                <Field label="Voice Clone">
                  <select value={form.voiceCloneId} onChange={(e) => setForm((s) => ({ ...s, voiceCloneId: e.target.value }))} className="input">
                    <option value="">No voice yet</option>
                    {voiceClones.map((clone) => <option key={clone.id} value={clone.id}>{clone.name}</option>)}
                  </select>
                </Field>
                <Field label="Aspect Ratio">
                  <select value={form.aspectRatio} onChange={(e) => setForm((s) => ({ ...s, aspectRatio: e.target.value }))} className="input">
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                  </select>
                </Field>
                <Field label="Duration (seconds)">
                  <input value={form.durationSeconds} type="number" min={15} max={180} onChange={(e) => setForm((s) => ({ ...s, durationSeconds: Number(e.target.value) }))} className="input" />
                </Field>
              </div>

              <Field label="Description" className="mt-4">
                <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="input min-h-[100px]" placeholder="What should this creator-style video communicate?" />
              </Field>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-zinc-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="button" onClick={handleCreate} disabled={submitting || !form.title.trim()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}