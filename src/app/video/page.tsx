'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Video, Plus, Search, MoreVertical, Play, Clock, CheckCircle2,
  AlertCircle, Loader2, Film, Trash2, Edit3, Download, Sparkles,
} from 'lucide-react';
import { useVideoProjects, VideoProject } from '@/hooks/useVideoProject';
import { passthroughImageLoader } from '@/lib/image-loader';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:      { label: 'Draft',      color: 'text-zinc-400 bg-zinc-400/10',   icon: Edit3 },
  PROCESSING: { label: 'Processing', color: 'text-amber-400 bg-amber-400/10', icon: Loader2 },
  READY:      { label: 'Ready',      color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2 },
  FAILED:     { label: 'Failed',     color: 'text-red-400 bg-red-400/10',     icon: AlertCircle },
  ARCHIVED:   { label: 'Archived',   color: 'text-zinc-600 bg-zinc-600/10',   icon: Clock },
};

function StatusBadge({ status }: { status: VideoProject['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: VideoProject;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const duration = project.durationMs
    ? `${Math.floor(project.durationMs / 60000)}:${String(Math.floor((project.durationMs % 60000) / 1000)).padStart(2, '0')}`
    : null;

  const ratio = project.height > project.width ? '9/16' : project.width === project.height ? '1/1' : '16/9';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl overflow-hidden glass border border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className={`relative bg-zinc-900 aspect-video overflow-hidden`}>
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover"
            loader={passthroughImageLoader}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-10 h-10 text-zinc-700" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {duration && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {duration}
          </span>
        )}

        {/* Ratio badge */}
        <span className="absolute top-2 left-2 bg-black/60 text-zinc-300 text-xs px-1.5 py-0.5 rounded">
          {ratio}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{project.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={project.status} />
              {project._count && (
                <span className="text-xs text-zinc-500">
                  {project._count.scenes} scene{project._count.scenes !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-8 z-50 w-40 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onOpen(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {project.outputUrl && (
                    <a
                      href={project.outputUrl}
                      download
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </motion.div>
  );
}

// ── New project modal ─────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, ratio: string) => void }) {
  const [title, setTitle] = useState('');
  const [ratio, setRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const ratios = [
    { value: '16:9', label: 'Landscape', desc: '1920 × 1080 — YouTube, Desktop' },
    { value: '9:16', label: 'Portrait',  desc: '1080 × 1920 — Reels, TikTok'   },
    { value: '1:1',  label: 'Square',    desc: '1080 × 1080 — Instagram, Feed'  },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-1">New Video Project</h2>
        <p className="text-sm text-zinc-400 mb-5">Give your project a name and choose an aspect ratio.</p>

        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Project Name</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && title.trim() && onCreate(title.trim(), ratio)}
            placeholder="My Awesome Video"
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Aspect Ratio</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {ratios.map((r) => (
              <button
                key={r.value}
                onClick={() => setRatio(r.value)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  ratio === r.value
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <span className="block text-sm font-semibold">{r.label}</span>
                <span className="block text-[10px] mt-0.5 opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!title.trim()}
            onClick={() => title.trim() && onCreate(title.trim(), ratio)}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Project
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoPage() {
  const router = useRouter();
  const { projects, loading, error, createProject, deleteProject } = useVideoProjects();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (title: string, ratio: string) => {
    try {
      const proj = await createProject(title, ratio);
      setShowNew(false);
      router.push(`/video/${proj.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Video Studio</h1>
              <p className="text-xs text-zinc-500">AI-powered video creation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/30 transition-colors w-56"
              />
            </div>

            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-zinc-400">Failed to load projects</p>
            <p className="text-sm text-zinc-600 mt-1">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {search ? 'No projects found' : 'Create your first video'}
            </h2>
            <p className="text-zinc-400 text-sm max-w-sm mb-6">
              {search
                ? `No projects match "${search}"`
                : 'Turn your script into a polished video in minutes with AI voiceovers, scenes, and subtitles.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => router.push(`/video/${project.id}`)}
                  onDelete={() => deleteProject(project.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* New project modal */}
      <AnimatePresence>
        {showNew && (
          <NewProjectModal
            onClose={() => setShowNew(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
