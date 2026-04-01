'use client';

import { cn } from '@/lib/utils';

const TONES = {
  live: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  focus: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  setup: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  neutral: 'border-white/10 bg-white/5 text-slate-300',
};

export function StatusBadge({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]', TONES[tone])}>
      {children}
    </span>
  );
}