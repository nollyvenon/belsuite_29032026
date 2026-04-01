'use client';

import { cn } from '@/lib/utils';

const ACCENTS = {
  amber: 'from-amber-400/20 to-orange-500/10 border-amber-300/20',
  sky: 'from-sky-400/20 to-cyan-500/10 border-sky-300/20',
  emerald: 'from-emerald-400/20 to-teal-500/10 border-emerald-300/20',
  violet: 'from-violet-400/20 to-fuchsia-500/10 border-violet-300/20',
};

export function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className={cn('rounded-[28px] border bg-gradient-to-br p-5 backdrop-blur-sm', ACCENTS[accent])}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  );
}