'use client';

import { motion } from 'motion/react';
import { Mic, Film, AlignJustify } from 'lucide-react';
import type { VideoScene } from '@/hooks/useVideoProject';

const TRACK_HEIGHT = 32;

export function VideoTimeline({
  scenes,
  selectedId,
  onSelect,
  totalDurationMs,
}: {
  scenes: VideoScene[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  totalDurationMs: number;
}) {
  const totalSec     = totalDurationMs / 1000 || 1;

  // Build ruler ticks (every second, with labels every 5s)
  const ticks = Array.from({ length: Math.ceil(totalSec) + 1 }, (_, i) => i);

  if (scenes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950/50">
        <p className="text-xs text-zinc-600">No scenes — timeline empty</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950/50 select-none overflow-hidden">
      {/* Ruler */}
      <div className="h-6 border-b border-white/5 flex items-end overflow-hidden relative px-16 shrink-0">
        <div className="absolute inset-y-0 left-0 w-16 bg-zinc-950/80 z-10 flex items-center justify-center">
          <AlignJustify className="w-3 h-3 text-zinc-600" />
        </div>
        <div className="flex-1 relative">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${(t / totalSec) * 100}%` }}
            >
              <span className={`text-[9px] text-zinc-600 mb-0.5 ${t % 5 !== 0 ? 'opacity-0' : ''}`}>
                {t}s
              </span>
              <div className={`w-px bg-zinc-700 ${t % 5 === 0 ? 'h-2.5' : 'h-1.5'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Video track */}
        <div className="flex" style={{ height: TRACK_HEIGHT }}>
          <div className="w-16 shrink-0 flex items-center justify-center border-r border-white/5 bg-zinc-950/60">
            <Film className="w-3 h-3 text-zinc-600" />
          </div>
          <div className="flex-1 relative">
            {scenes.map((scene, i) => {
              const offsetMs = scenes.slice(0, i).reduce((sum, s) => sum + s.durationMs, 0);
              const leftPct  = (offsetMs / totalDurationMs) * 100;
              const widthPct = (scene.durationMs / totalDurationMs) * 100;
              return (
                <motion.div
                  key={scene.id}
                  onClick={() => onSelect(scene.id)}
                  className={`absolute top-1 bottom-1 rounded cursor-pointer flex items-center px-1.5 overflow-hidden transition-colors ${
                    selectedId === scene.id
                      ? 'bg-primary/60 border border-primary/80'
                      : 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30'
                  }`}
                  style={{ left: `${leftPct}%`, width: `calc(${widthPct}% - 2px)` }}
                  title={scene.scriptSegment ?? `Scene ${scene.order + 1}`}
                >
                  <span className="text-[9px] text-white/70 truncate">
                    {scene.order + 1}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Voiceover track */}
        <div className="flex" style={{ height: TRACK_HEIGHT }}>
          <div className="w-16 shrink-0 flex items-center justify-center border-r border-white/5 bg-zinc-950/60">
            <Mic className="w-3 h-3 text-zinc-600" />
          </div>
          <div className="flex-1 relative">
            {scenes
              .filter((s) => s.voiceoverUrl)
              .map((scene) => {
                const offsetMs = scenes.slice(0, scenes.indexOf(scene)).reduce((sum, s) => sum + s.durationMs, 0);
                const leftPct  = (offsetMs / totalDurationMs) * 100;
                const widthPct = (scene.durationMs / totalDurationMs) * 100;
                return (
                  <div
                    key={scene.id}
                    onClick={() => onSelect(scene.id)}
                    className="absolute top-1 bottom-1 rounded bg-amber-500/20 border border-amber-500/30 cursor-pointer flex items-center px-1.5"
                    style={{ left: `${leftPct}%`, width: `calc(${widthPct}% - 2px)` }}
                  >
                    <span className="text-[9px] text-amber-300/70 truncate">VO</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
