'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  ChevronDown,
  Clapperboard,
  FileVideo,
  Loader2,
  Mic2,
  Sparkles,
  Video,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import { AvatarStudio } from '@/components/ugc/AvatarStudio';
import { RenderQueuePanel } from '@/components/ugc/RenderQueuePanel';
import { ScriptToVideoPanel } from '@/components/ugc/ScriptToVideoPanel';
import { UGCOverview } from '@/components/ugc/UGCOverview';
import { UGCProjectsView } from '@/components/ugc/UGCProjectsView';
import { VoiceClonesPanel } from '@/components/ugc/VoiceClonesPanel';
import { useUGCDashboard, useUGCProjects } from '@/hooks/useUGC';

type Tab = 'overview' | 'projects' | 'avatars' | 'scripts' | 'voices' | 'renders';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', Icon: Wand2 },
  { id: 'projects', label: 'Projects', Icon: Clapperboard },
  { id: 'avatars', label: 'Avatars', Icon: Bot },
  { id: 'scripts', label: 'Script → Video', Icon: Sparkles },
  { id: 'voices', label: 'Voice Clones', Icon: Mic2 },
  { id: 'renders', label: 'Renders', Icon: Video },
];

function ProjectSelector({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { projects } = useUGCProjects();
  const [open, setOpen] = useState(false);
  const selected = projects.find((project) => project.id === selectedId);

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
        <FileVideo className="w-4 h-4 text-zinc-400" />
        <span className="max-w-[220px] truncate">{selected?.title ?? 'Select project'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute top-full right-0 mt-1 z-20 min-w-[260px] rounded-xl border border-white/10 bg-[#111] p-1 shadow-2xl">
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-500">No projects yet</div>
            ) : (
              projects.map((project) => (
                <button key={project.id} onClick={() => { onSelect(project.id); setOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center justify-between gap-2 ${project.id === selectedId ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="truncate">{project.title}</span>
                  <span className="text-[11px] text-zinc-600">{project.status}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function UGCPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { overview, loading, error } = useUGCDashboard();
  const { projects } = useUGCProjects();

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const needsProject = tab === 'scripts' || tab === 'renders';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">UGC Content Generator</h1>
              <p className="text-xs text-zinc-500">AI avatars, cloned voices, human-like scripts, scalable renders</p>
            </div>
          </div>

          {needsProject && <ProjectSelector selectedId={selectedProjectId} onSelect={setSelectedProjectId} />}
        </div>

        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && (
              loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
              ) : error ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-red-400"><AlertCircle className="w-4 h-4" /> {error}</div>
              ) : overview ? (
                <UGCOverview overview={overview} />
              ) : null
            )}

            {tab === 'projects' && <UGCProjectsView />}
            {tab === 'avatars' && <AvatarStudio />}
            {tab === 'voices' && <VoiceClonesPanel />}
            {tab === 'scripts' && (selectedProjectId ? <ScriptToVideoPanel projectId={selectedProjectId} /> : <NoProjectSelected label="script generation" />)}
            {tab === 'renders' && (selectedProjectId ? <RenderQueuePanel projectId={selectedProjectId} /> : <NoProjectSelected label="rendering" />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function NoProjectSelected({ label }: { label: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
      <FileVideo className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-400 mb-1">Select a project to continue with {label}</p>
      <p className="text-xs text-zinc-600">Use the project selector in the top-right corner.</p>
    </div>
  );
}