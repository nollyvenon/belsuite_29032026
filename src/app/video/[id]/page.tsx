'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Download, Loader2, Sparkles, RotateCcw,
  Settings, Clapperboard, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useVideoEditor } from '@/hooks/useVideoProject';
import { ScenePanel } from '@/components/video/ScenePanel';
import { MediaPanel } from '@/components/video/MediaPanel';
import { VideoTimeline } from '@/components/video/VideoTimeline';
import { PropertiesPanel } from '@/components/video/PropertiesPanel';
import { ScriptGeneratorModal } from '@/components/video/ScriptGeneratorModal';

type LeftTab = 'scenes' | 'media';

// ── Playback controls ─────────────────────────────────────────────────────────

function PlaybackBar({
  playing,
  muted,
  currentMs,
  durationMs,
  onTogglePlay,
  onToggleMute,
  onSeek,
}: {
  playing: boolean;
  muted: boolean;
  currentMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (ms: number) => void;
}) {
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 border-t border-white/5">
      <button onClick={() => onSeek(0)} className="text-zinc-400 hover:text-white transition-colors">
        <SkipBack className="w-4 h-4" />
      </button>
      <button
        onClick={onTogglePlay}
        className="w-8 h-8 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-colors"
      >
        {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <button onClick={() => onSeek(durationMs)} className="text-zinc-400 hover:text-white transition-colors">
        <SkipForward className="w-4 h-4" />
      </button>

      <span className="text-xs text-zinc-500 font-mono w-24 shrink-0 text-center">
        {fmt(currentMs)} / {fmt(durationMs)}
      </span>

      <div className="flex-1 relative h-1.5 bg-zinc-700 rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek(Math.round(ratio * durationMs));
        }}
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-none"
          style={{ width: `${durationMs ? (currentMs / durationMs) * 100 : 0}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${durationMs ? (currentMs / durationMs) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <button onClick={onToggleMute} className="text-zinc-400 hover:text-white transition-colors">
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({
  outputUrl,
  thumbnailUrl,
  width,
  height,
  status,
  onRender,
  rendering,
}: {
  outputUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  status: string;
  onRender: () => void;
  rendering: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const isPortrait = height > width;
  const maxH = isPortrait ? 'max-h-[380px]' : 'max-h-[340px]';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentMs(v.currentTime * 1000);
    const onMeta = () => setDurationMs(v.duration * 1000);
    const onEnd  = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended', onEnd);
    };
  }, [outputUrl]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  }, [playing]);

  const handleSeek = useCallback((ms: number) => {
    if (videoRef.current) videoRef.current.currentTime = ms / 1000;
    setCurrentMs(ms);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center bg-black/40 relative overflow-hidden">
        {outputUrl ? (
          <video
            ref={videoRef}
            src={outputUrl}
            poster={thumbnailUrl}
            muted={muted}
            className={`${maxH} w-auto max-w-full rounded-lg shadow-2xl`}
            onClick={togglePlay}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            {status === 'PROCESSING' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <p className="text-zinc-400 text-sm">Rendering your video…</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Clapperboard className="w-8 h-8 text-primary" />
                </div>
                <p className="text-zinc-300 font-semibold">No preview yet</p>
                <p className="text-zinc-500 text-sm">Add scenes and render to preview your video</p>
                <button
                  onClick={onRender}
                  disabled={rendering || status === 'PROCESSING'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Render Video
                </button>
              </>
            )}
          </div>
        )}

        {/* Render button overlay when video exists */}
        {outputUrl && (
          <button
            onClick={onRender}
            disabled={rendering || status === 'PROCESSING'}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm disabled:opacity-40 transition-colors"
          >
            {rendering ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Re-render
          </button>
        )}
      </div>

      {outputUrl && (
        <PlaybackBar
          playing={playing}
          muted={muted}
          currentMs={currentMs}
          durationMs={durationMs}
          onTogglePlay={togglePlay}
          onToggleMute={() => {
            setMuted(!muted);
            if (videoRef.current) videoRef.current.muted = !muted;
          }}
          onSeek={handleSeek}
        />
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${
        type === 'success'
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoEditorPage() {
  const params   = useParams();
  const router   = useRouter();
  const projectId = (params?.id ?? '') as string;

  const {
    project, loading, error, generating, rendering,
    generateFromScript, queueRender, updateScene,
    uploadMedia, deleteAsset, generateSubtitles,
  } = useVideoEditor(projectId);

  const [leftTab, setLeftTab]       = useState<LeftTab>('scenes');
  const [showScript, setShowScript] = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleRender = useCallback(async () => {
    try {
      await queueRender();
      showToast('Render job queued! Your video will be ready soon.');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }, [queueRender, showToast]);

  const handleGenerate = useCallback(async (script: string, voiceId: string, aspectRatio: string) => {
    try {
      await generateFromScript(script, voiceId, aspectRatio);
      setShowScript(false);
      showToast('Scenes generated from script!');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }, [generateFromScript, showToast]);

  const handleSubtitles = useCallback(async () => {
    try {
      await generateSubtitles();
      showToast('Subtitle generation queued!');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }, [generateSubtitles, showToast]);

  const selectedScene = project?.scenes.find((s) => s.id === selectedSceneId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-zinc-300 font-semibold">{error ?? 'Project not found'}</p>
        <button onClick={() => router.push('/video')} className="text-sm text-primary hover:underline">
          Back to Video Studio
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0D0D0D] text-white flex flex-col overflow-hidden">
      {/* ── Topbar ── */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/video')}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{project.title}</p>
            <p className="text-[10px] text-zinc-500 leading-tight">
              {project.width}×{project.height} · {project.fps}fps
            </p>
          </div>
        </div>

        {/* Center actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScript(true)}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate from Script
          </button>

          <button
            onClick={handleRender}
            disabled={rendering || project.status === 'PROCESSING'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            {rendering || project.status === 'PROCESSING'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Play className="w-3 h-3" />}
            Render
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {project.outputUrl && (
            <a
              href={project.outputUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          )}
          <button
            onClick={handleSubtitles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Subtitles
          </button>
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel */}
        <div className="w-64 shrink-0 border-r border-white/5 flex flex-col">
          {/* Tab strip */}
          <div className="flex border-b border-white/5 shrink-0">
            {(['scenes', 'media'] as LeftTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                  leftTab === tab
                    ? 'text-white border-b-2 border-primary'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === 'scenes' ? (
              <ScenePanel
                scenes={project.scenes}
                selectedId={selectedSceneId}
                onSelect={setSelectedSceneId}
                onUpdate={async (sceneId, patch) => {
                  try {
                    await updateScene(sceneId, patch);
                    showToast('Scene updated.');
                  } catch (e) {
                    showToast((e as Error).message, 'error');
                  }
                }}
              />
            ) : (
              <MediaPanel
                assets={project.mediaAssets}
                onUpload={async (file) => {
                  try {
                    await uploadMedia(file);
                    showToast('Asset uploaded.');
                  } catch (e) {
                    showToast((e as Error).message, 'error');
                  }
                }}
                onDelete={async (id) => {
                  try {
                    await deleteAsset(id);
                    showToast('Asset deleted.');
                  } catch (e) {
                    showToast((e as Error).message, 'error');
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Center: Preview + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PreviewPanel
              outputUrl={project.outputUrl}
              thumbnailUrl={project.thumbnailUrl}
              width={project.width}
              height={project.height}
              status={project.status}
              onRender={handleRender}
              rendering={rendering || project.status === 'PROCESSING'}
            />
          </div>

          {/* Timeline */}
          <div className="h-40 shrink-0 border-t border-white/5 overflow-hidden">
            <VideoTimeline
              scenes={project.scenes}
              selectedId={selectedSceneId}
              onSelect={setSelectedSceneId}
              totalDurationMs={project.durationMs ?? project.scenes.reduce((acc, s) => acc + s.durationMs, 0)}
            />
          </div>
        </div>

        {/* Right panel: Properties */}
        <div className="w-64 shrink-0 border-l border-white/5 overflow-y-auto">
          <PropertiesPanel
            project={project}
            selectedScene={selectedScene}
            onUpdate={async (sceneId, patch) => {
              try {
                await updateScene(sceneId, patch);
                showToast('Scene updated.');
              } catch (e) {
                showToast((e as Error).message, 'error');
              }
            }}
          />
        </div>
      </div>

      {/* Script Generator Modal */}
      <AnimatePresence>
        {showScript && (
          <ScriptGeneratorModal
            project={project}
            generating={generating}
            onClose={() => setShowScript(false)}
            onGenerate={handleGenerate}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
