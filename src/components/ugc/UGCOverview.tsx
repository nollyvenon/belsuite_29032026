'use client';

import { motion } from 'motion/react';
import {
  Film,
  CheckCircle2,
  Rocket,
  Bot,
  Mic2,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import type { UGCDashboardOverview } from '@/hooks/useUGC';

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function UGCOverview({ overview }: { overview: UGCDashboardOverview }) {
  const stats = [
    { label: 'Projects', value: overview.totalProjects, Icon: Film, tone: 'text-white' },
    { label: 'Ready', value: overview.readyProjects, Icon: CheckCircle2, tone: 'text-emerald-400' },
    { label: 'Published', value: overview.publishedProjects, Icon: Rocket, tone: 'text-sky-400' },
    { label: 'Avatars', value: overview.avatarsAvailable, Icon: Bot, tone: 'text-amber-400' },
    { label: 'Voice Clones', value: overview.voiceClonesAvailable, Icon: Mic2, tone: 'text-violet-400' },
    { label: 'Rendering', value: overview.rendersInFlight, Icon: Loader2, tone: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, Icon, tone }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${label === 'Rendering' && value > 0 ? 'animate-spin' : ''} ${tone}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Recent UGC Projects</h3>
              <p className="text-sm text-zinc-500">Track realism, readiness, and output velocity.</p>
            </div>
          </div>
          <div className="space-y-3">
            {overview.recentProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
                No UGC projects yet.
              </div>
            ) : (
              overview.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{project.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{project.avatarName ?? 'No avatar assigned'}</span>
                      <span>•</span>
                      <span>{fmtDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/5 text-zinc-300">
                      {project.status}
                    </span>
                    {project.outputUrl && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 via-white/[0.03] to-transparent border border-white/5 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white">Scalability Notes</h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-400">
            <p>Avatar, voice, script, and render state are split into discrete models so rendering can move to queue workers without changing the UI contract.</p>
            <p>Brand context is captured once at project creation and can still be edited later, which keeps generations deterministic while respecting updated brand voice.</p>
            <p>Render settings snapshot the face animation, lip sync, captions, and aspect ratio at request time for auditability and reproducibility.</p>
          </div>
        </div>
      </div>
    </div>
  );
}