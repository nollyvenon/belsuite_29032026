'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { PlayCircle, Rocket, Video, Captions, AudioLines, BadgeCheck } from 'lucide-react';
import { useUGCStudio } from '@/hooks/useUGC';
import { passthroughImageLoader } from '@/lib/image-loader';

export function RenderQueuePanel({ projectId }: { projectId: string }) {
  const { project, loading, saving, renderProject, publishProject } = useUGCStudio(projectId);
  const [settings, setSettings] = useState({
    faceAnimation: true,
    lipSyncIntensity: 0.82,
    resolution: '1080p',
    enableCaptions: true,
    backgroundMusic: false,
    aspectRatio: '9:16',
  });

  const latestRender = useMemo(() => project?.renders?.[0] ?? null, [project?.renders]);

  if (loading) {
    return <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-10 text-center text-zinc-500">Loading render state...</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold"><PlayCircle className="w-4 h-4 text-primary" /> Render Settings</div>
        <div className="space-y-4">
          <ToggleRow icon={Video} label="Face Animation" value={settings.faceAnimation} onChange={() => setSettings((s) => ({ ...s, faceAnimation: !s.faceAnimation }))} />
          <ToggleRow icon={Captions} label="Captions" value={settings.enableCaptions} onChange={() => setSettings((s) => ({ ...s, enableCaptions: !s.enableCaptions }))} />
          <ToggleRow icon={AudioLines} label="Background Music" value={settings.backgroundMusic} onChange={() => setSettings((s) => ({ ...s, backgroundMusic: !s.backgroundMusic }))} />

          <Field label="Lip Sync Intensity">
            <input type="range" min={0.1} max={1} step={0.01} value={settings.lipSyncIntensity} onChange={(e) => setSettings((s) => ({ ...s, lipSyncIntensity: Number(e.target.value) }))} className="w-full" />
            <div className="text-xs text-zinc-500 mt-2">{Math.round(settings.lipSyncIntensity * 100)}%</div>
          </Field>

          <Field label="Resolution"><select value={settings.resolution} onChange={(e) => setSettings((s) => ({ ...s, resolution: e.target.value }))} className="input"><option value="720p">720p</option><option value="1080p">1080p</option><option value="4k">4k</option></select></Field>
          <Field label="Aspect Ratio"><select value={settings.aspectRatio} onChange={(e) => setSettings((s) => ({ ...s, aspectRatio: e.target.value }))} className="input"><option value="9:16">9:16</option><option value="1:1">1:1</option><option value="16:9">16:9</option></select></Field>

          <button onClick={() => renderProject(settings as any)} disabled={saving || !project?.script?.content} className="w-full rounded-xl bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? 'Rendering...' : 'Render video'}</button>
          <button onClick={() => publishProject()} disabled={saving || project?.status !== 'READY'} className="w-full rounded-xl border border-white/10 text-zinc-200 py-2.5 text-sm font-semibold hover:bg-white/5 disabled:opacity-50">Publish project</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Latest Render</h3>
              <p className="text-sm text-zinc-500">A render snapshot includes avatar, voice, captions, and animation settings for repeatability.</p>
            </div>
            {project?.status === 'PUBLISHED' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs"><BadgeCheck className="w-3.5 h-3.5" /> Published</span>}
          </div>

          {latestRender ? (
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl overflow-hidden bg-zinc-900 aspect-[9/16] flex items-center justify-center">
                {latestRender.thumbnailUrl || project?.thumbnailUrl ? (
                  <Image
                    src={latestRender.thumbnailUrl || project?.thumbnailUrl || ''}
                    alt={project?.title || 'Render thumbnail'}
                    width={540}
                    height={960}
                    className="w-full h-full object-cover"
                    loader={passthroughImageLoader}
                    unoptimized
                  />
                ) : (
                  <Video className="w-10 h-10 text-zinc-700" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">{latestRender.status}</span>
                  <span className="text-zinc-500">{latestRender.provider}</span>
                </div>
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>Progress: <span className="text-white">{latestRender.progress}%</span></p>
                  <p>Duration: <span className="text-white">{latestRender.durationSeconds ?? project?.durationSeconds ?? '—'} sec</span></p>
                  <p>Created: <span className="text-white">{new Date(latestRender.createdAt).toLocaleString()}</span></p>
                </div>
                {(latestRender.videoUrl || project?.outputUrl) && (
                  <a href={latestRender.videoUrl || project?.outputUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-5 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold">
                    <Rocket className="w-4 h-4" /> Open output
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-zinc-500">No render has been produced yet.</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-white mb-4">Render History</h3>
          <div className="space-y-3">
            {project?.renders?.length ? project.renders.map((render) => (
              <div key={render.id} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{render.provider}</p>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(render.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-300">{render.status}</span>
                  <span className="text-zinc-500">{render.progress}%</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-zinc-500">Render history will appear here.</div>
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

function ToggleRow({ icon: Icon, label, value, onChange }: { icon: React.ElementType; label: string; value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-full rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm text-zinc-200">{label}</span>
      </div>
      <span className={`w-10 h-6 rounded-full p-1 transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}