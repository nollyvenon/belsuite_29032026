'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Mic, ChevronDown, ChevronUp, Edit3, Check, X } from 'lucide-react';
import type { VideoScene } from '@/hooks/useVideoProject';

function SceneCard({
  scene,
  selected,
  onSelect,
  onUpdate,
}: {
  scene: VideoScene;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<VideoScene>) => Promise<void>;
}) {
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState(scene.scriptSegment ?? '');
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const durationSec = (scene.durationMs / 1000).toFixed(1);

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate({ scriptSegment: draft });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`mx-2 my-1.5 rounded-xl border transition-colors cursor-pointer ${
        selected
          ? 'border-primary/50 bg-primary/5'
          : 'border-white/5 bg-white/3 hover:border-white/10'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-zinc-400">{scene.order + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-300 truncate">
            {scene.scriptSegment ? scene.scriptSegment.slice(0, 50) + (scene.scriptSegment.length > 50 ? '…' : '') : 'Empty scene'}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{durationSec}s</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {scene.voiceoverUrl && <Mic className="w-3 h-3 text-emerald-400" />}
          {scene.backgroundUrl && <Film className="w-3 h-3 text-blue-400" />}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-white/5 mt-0 pt-2.5">
              {editing ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="Scene script…"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => { setDraft(scene.scriptSegment ?? ''); setEditing(false); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                    {scene.scriptSegment || <span className="italic text-zinc-600">No script text</span>}
                  </p>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <Edit3 className="w-3 h-3" /> Edit script
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScenePanel({
  scenes,
  selectedId,
  onSelect,
  onUpdate,
}: {
  scenes: VideoScene[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (sceneId: string, patch: Partial<VideoScene>) => Promise<void>;
}) {
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <Film className="w-8 h-8 text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-500">No scenes yet</p>
        <p className="text-xs text-zinc-600 mt-1">Use "Generate from Script" to create scenes automatically</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <AnimatePresence>
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            selected={selectedId === scene.id}
            onSelect={() => onSelect(scene.id)}
            onUpdate={(patch) => onUpdate(scene.id, patch)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
