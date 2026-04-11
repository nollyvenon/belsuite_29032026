'use client';

import Link from 'next/link';
import { Workflow, CalendarDays, BrainCircuit, ShieldCheck } from 'lucide-react';

const capabilities = [
  'Handle workflow coordination and task execution',
  'Use strategy, calendar, and campaign context',
  'Persist actions back into CRM and automation',
  'Monitor outcomes through analytics and events',
];

export default function AIOperationsManagerPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-sm text-violet-300">
            <Workflow className="h-4 w-4" />
            AI Operations Manager
          </div>
          <h1 className="mt-4 text-4xl font-bold">An AI ops manager that handles workflows end to end.</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            This surface sits on the existing assistant, calendar, orchestration, and event bus layers so operations can be automated without becoming a black box.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai-ceo" className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-black">
              Open strategy console
            </Link>
            <Link href="/automation" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Open workflows
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
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-violet-300" /> Shared flow</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Operations decisions should trigger real workflow steps, calendar updates, and CRM changes so the assistant improves the business instead of merely suggesting actions.
          </p>
        </section>
      </div>
    </main>
  );
}
