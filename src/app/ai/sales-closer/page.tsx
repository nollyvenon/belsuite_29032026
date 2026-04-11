'use client';

import Link from 'next/link';
import { PhoneCall, Target, Route, Sparkles } from 'lucide-react';

const capabilities = [
  'Qualify inbound and outbound leads',
  'Respond to objections with CRM context',
  'Trigger follow-up tasks and booking flows',
  'Persist outcomes into deals and activities',
];

export default function AISalesCloserPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-300">
            <Target className="h-4 w-4" />
            AI Sales Closer
          </div>
          <h1 className="mt-4 text-4xl font-bold">An AI closer that responds, qualifies, and follows up.</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            This role is built on the current AI calling, CRM, and workflow stack so sales conversations become pipeline movement instead of disconnected conversations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai-calling" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-black">
              Open AI calling
            </Link>
            <Link href="/deals" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Review deals
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {capabilities.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              {item}
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Route className="h-5 w-5 text-sky-300" /> Shared flow</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Sales responses should update CRM records, launch follow-up tasks, and feed analytics so the closer contributes directly to revenue operations.
          </p>
        </section>
      </div>
    </main>
  );
}
