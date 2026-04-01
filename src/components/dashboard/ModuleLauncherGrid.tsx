'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { type WorkspaceModuleCard } from '@/lib/api/modules/workspace';
import { StatusBadge } from '@/components/system/StatusBadge';

export function ModuleLauncherGrid({ modules }: { modules: WorkspaceModuleCard[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {modules.map((module) => (
        <Link key={module.id} href={module.href} className="group rounded-[28px] border border-white/10 bg-black/20 p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <StatusBadge tone={module.state}>{module.state}</StatusBadge>
              <h3 className="mt-4 text-xl font-semibold text-white">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/5 pt-4">
            <div>
              <p className="text-3xl font-semibold text-white">{module.metric}</p>
              <p className="mt-1 text-sm text-slate-500">{module.detail}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}