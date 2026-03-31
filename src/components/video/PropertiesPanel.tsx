'use client';

import { useState } from 'react';
import { Sliders, Clock, Mic, Film, Info } from 'lucide-react';
import type { VideoScene, VideoProject } from '@/hooks/useVideoProject';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 pb-4 mb-0">
      <p className="px-4 pt-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{title}</p>
      <div className="px-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs text-zinc-300 font-medium">{value}</span>
    </div>
  );
}

type ProjectWithExtras = VideoProject & {
  scenes: VideoScene[];
  mediaAssets: { id: string }[];
  processingJobs: { id: string; status: string }[];
  subtitleTracks: { id: string; language: string }[];
};

export function PropertiesPanel({
  project,
  selectedScene,
  onUpdate,
}: {
  project: ProjectWithExtras;
  selectedScene: VideoScene | null;
  onUpdate: (sceneId: string, patch: Partial<VideoScene>) => Promise<void>;
}) {
  const [durationDraft, setDurationDraft] = useState('');
  const [editingDuration, setEditingDuration] = useState(false);

  const totalMs = project.durationMs ?? project.scenes.reduce((sum, s) => sum + s.durationMs, 0);
  const totalSec = (totalMs / 1000).toFixed(1);

  if (selectedScene) {
    const sceneDurationSec = (selectedScene.durationMs / 1000).toFixed(1);

    return (
      <div>
        <Section title={`Scene ${selectedScene.order + 1}`}>
          <Row label="Duration" value={`${sceneDurationSec}s`} />
          <Row label="Order" value={selectedScene.order + 1} />
          {selectedScene.voiceoverUrl && <Row label="Voiceover" value="✓ attached" />}
          {selectedScene.backgroundUrl && <Row label="Background" value="✓ attached" />}
        </Section>

        <Section title="Script">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {selectedScene.scriptSegment || <span className="italic text-zinc-600">No script text</span>}
          </p>
        </Section>

        <Section title="Duration">
          {editingDuration ? (
            <div className="flex gap-2 mt-1">
              <input
                autoFocus
                type="number"
                min={1}
                max={300}
                value={durationDraft}
                onChange={(e) => setDurationDraft(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40 transition-colors"
                placeholder="Seconds"
              />
              <button
                onClick={async () => {
                  const ms = Math.round(parseFloat(durationDraft) * 1000);
                  if (ms > 0) {
                    await onUpdate(selectedScene.id, { durationMs: ms });
                    setEditingDuration(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Set
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDurationDraft(sceneDurationSec);
                setEditingDuration(true);
              }}
              className="text-xs text-primary hover:underline"
            >
              Edit duration ({sceneDurationSec}s)
            </button>
          )}
        </Section>
      </div>
    );
  }

  // Project-level info
  return (
    <div>
      <Section title="Project">
        <Row label="Resolution" value={`${project.width}×${project.height}`} />
        <Row label="FPS" value={project.fps} />
        <Row label="Duration" value={`${totalSec}s`} />
        <Row label="Scenes" value={project.scenes.length} />
        <Row label="Assets" value={project.mediaAssets.length} />
        <Row label="Status" value={project.status} />
      </Section>

      <Section title="Subtitles">
        {project.subtitleTracks.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">No subtitle tracks</p>
        ) : (
          project.subtitleTracks.map((t) => (
            <Row key={t.id} label="Language" value={t.language} />
          ))
        )}
      </Section>

      <Section title="Jobs">
        {project.processingJobs.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">No jobs</p>
        ) : (
          project.processingJobs.slice(0, 3).map((j) => (
            <Row key={j.id} label={j.id.slice(-6)} value={j.status} />
          ))
        )}
      </Section>

      <div className="px-4 pt-3">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/5">
          <Info className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Click a scene in the left panel or on the timeline to edit its properties here.
          </p>
        </div>
      </div>
    </div>
  );
}
