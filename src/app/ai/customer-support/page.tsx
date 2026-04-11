'use client';

import Link from 'next/link';
import { MessageSquare, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';

const capabilities = [
  'WhatsApp and web support intake',
  'Instant answers from shared knowledge and CRM context',
  'Escalation into workflows, tickets, or follow-up tasks',
  'Unified history across chat, CRM, and analytics',
];

export default function AICustomerSupportPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
              <MessageSquare className="h-4 w-4" />
              Customer Support Agent
            </span>
            <span>WhatsApp + web</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold">AI support that resolves, routes, and remembers.</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            This surface sits on top of the existing WhatsApp, web, CRM, and orchestration layers so support conversations can become real business actions instead of isolated chats.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/integrations" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black">
              View integrations
            </Link>
            <Link href="/crm-engine" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Open CRM
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
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-300" /> Shared flow</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Incoming support messages should resolve through existing messaging providers, write back to CRM activities, and escalate via workflows when the agent cannot close the loop immediately.
          </p>
        </section>
      </div>
    </main>
  );
}
