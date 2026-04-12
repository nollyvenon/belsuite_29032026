'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  LayoutDashboard,
  Mail,
  Mic,
  Phone,
  Play,
  Sparkles,
  Video,
  Workflow,
  Zap,
} from 'lucide-react';

type DemoId = 'crm' | 'content' | 'ai' | 'calling' | 'automation' | 'video' | 'marketing';

const DEMOS: {
  id: DemoId;
  label: string;
  short: string;
  icon: typeof BarChart3;
  href: string;
  hrefLabel: string;
}[] = [
  {
    id: 'crm',
    label: 'CRM & deals',
    short: 'Pipeline, scoring, AI deal insights',
    icon: BarChart3,
    href: '/deals',
    hrefLabel: 'Open deals workspace',
  },
  {
    id: 'content',
    label: 'Content studio',
    short: 'Scripts, posts, scheduling, UGC',
    icon: Sparkles,
    href: '/content',
    hrefLabel: 'Open content hub',
  },
  {
    id: 'ai',
    label: 'AI generation',
    short: 'Prompts, drafts, brand voice',
    icon: Bot,
    href: '/ai/generate',
    hrefLabel: 'Open AI generate',
  },
  {
    id: 'calling',
    label: 'AI calling',
    short: 'Outbound follow-up & qualification',
    icon: Phone,
    href: '/ai-calling',
    hrefLabel: 'Open calling module',
  },
  {
    id: 'automation',
    label: 'Automation',
    short: 'Triggers, journeys, hand-offs',
    icon: Workflow,
    href: '/marketing-automation',
    hrefLabel: 'Open automation',
  },
  {
    id: 'video',
    label: 'Video',
    short: 'Projects, renders, assets',
    icon: Video,
    href: '/video',
    hrefLabel: 'Open video studio',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    short: 'Campaigns, funnels, analytics',
    icon: Mail,
    href: '/marketing',
    hrefLabel: 'Open marketing',
  },
];

function parseHash(): DemoId {
  if (typeof window === 'undefined') return 'crm';
  const h = window.location.hash.replace('#', '') as DemoId;
  return DEMOS.some((d) => d.id === h) ? h : 'crm';
}

function CrmPreview() {
  const cols = [
    {
      name: 'Qualified',
      color: 'border-blue-500/40 bg-blue-500/10',
      deals: [
        { title: 'Northwind expansion', meta: '$48k · 72%', hot: true },
        { title: 'Atlas trial follow-up', meta: '$6k · 40%', hot: false },
      ],
    },
    {
      name: 'Proposal',
      color: 'border-amber-500/40 bg-amber-500/10',
      deals: [{ title: 'Globex SOC2 renewal', meta: '$120k · 55%', hot: true }],
    },
    {
      name: 'Negotiation',
      color: 'border-orange-500/40 bg-orange-500/10',
      deals: [{ title: 'Umbrella pilot', meta: '$22k · 30%', hot: false }],
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cols.map((c) => (
        <div key={c.name} className={`rounded-xl border ${c.color} p-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{c.name}</p>
          <div className="mt-3 space-y-2">
            {c.deals.map((d) => (
              <div
                key={d.title}
                className="rounded-lg border border-white/10 bg-black/40 p-3 text-left"
              >
                <p className="text-sm font-semibold text-white">{d.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{d.meta}</p>
                {d.hot && (
                  <span className="mt-2 inline-block rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                    AI score · prioritize
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-left">
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <span className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300">Blog</span>
        <span className="rounded px-2 py-1 text-xs text-zinc-500">LinkedIn</span>
        <span className="rounded px-2 py-1 text-xs text-zinc-500">Email</span>
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs text-zinc-400">
        <p className="text-emerald-400/90"># Outline</p>
        <p>- Hook: outcome in first line</p>
        <p>- Proof: customer metric</p>
        <p>- CTA: book a walkthrough</p>
        <p className="animate-pulse text-orange-300/80">▌ AI drafting body copy…</p>
      </div>
      <div className="mt-4 flex gap-2">
        <CalendarClock className="h-4 w-4 text-orange-400" />
        <span className="text-xs text-zinc-500">Schedule to channels + track performance</span>
      </div>
    </div>
  );
}

function AiPreview() {
  return (
    <div className="space-y-4 text-left">
      <div className="rounded-xl border border-orange-500/30 bg-orange-950/40 p-4">
        <p className="text-xs font-semibold text-orange-300">Prompt</p>
        <p className="mt-2 text-sm text-zinc-200">
          Turn this outline into a concise landing page section for finance teams…
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <p className="text-xs font-semibold text-zinc-500">Response</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Here’s a hero + three proof points with tone: confident, plain language, no jargon…
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">shorter</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">more CTA</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">EU tone</span>
        </div>
      </div>
    </div>
  );
}

function CallingPreview() {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center">
      <div className="mx-auto flex h-14 max-w-xs items-end justify-center gap-1">
        {[4, 7, 5, 9, 6, 11, 8, 5, 7, 4, 6, 9].map((h, i) => (
          <span
            key={i}
            className="w-1.5 animate-pulse rounded-full bg-emerald-400/80"
            style={{ height: `${h * 4}px`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <Mic className="mx-auto mt-4 h-8 w-8 text-emerald-400" />
      <p className="mt-3 text-sm text-zinc-300">Live-style call flow: qualify → book → log to CRM</p>
      <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-xs text-zinc-400">
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Opening script + objection handling
        </li>
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Calendar hand-off when intent is high
        </li>
      </ul>
    </div>
  );
}

function AutomationPreview() {
  const nodes = ['Web form', 'Score lead', 'Email drip', 'If booked → Slack'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
      {nodes.map((n, i) => (
        <div key={n} className="flex items-center gap-2">
          <span className="rounded-lg border border-violet-400/40 bg-violet-950/50 px-3 py-2 font-medium text-violet-200">
            {n}
          </span>
          {i < nodes.length - 1 && <Zap className="h-4 w-4 text-violet-400/60" />}
        </div>
      ))}
    </div>
  );
}

function VideoPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-left">
      <div className="flex gap-1 rounded bg-black/60 p-2">
        {['Intro', 'Demo', 'CTA'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 rounded px-2 py-3 text-center text-[10px] font-bold ${
              i === 1 ? 'bg-orange-500/30 text-orange-200' : 'text-zinc-500'
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <div className="mt-4 aspect-video rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
        <Play className="h-12 w-12 text-white/40" />
      </div>
      <p className="mt-2 text-xs text-zinc-500">Render queue · versions · export presets</p>
    </div>
  );
}

function MarketingPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-sm font-semibold text-white">Spring launch</span>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          Live
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { ch: 'Email', kpi: '42% open · 11% click' },
          { ch: 'SMS', kpi: '98% delivered' },
          { ch: 'Retarget', kpi: 'ROAS 3.2x' },
        ].map((r) => (
          <div key={r.ch} className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{r.ch}</span>
            <span className="font-mono text-zinc-300">{r.kpi}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [active, setActive] = useState<DemoId>('crm');

  useEffect(() => {
    setActive(parseHash());
    const onHash = () => setActive(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const select = useCallback((id: DemoId) => {
    setActive(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  }, []);

  const current = useMemo(() => DEMOS.find((d) => d.id === active)!, [active]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-400">Interactive product demos</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Explore each capability
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Static previews below mirror how modules behave. Use{' '}
              <span className="text-zinc-200">Open full module</span> to work with the real app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
        <nav
          className="flex shrink-0 flex-wrap gap-2 lg:w-56 lg:flex-col lg:flex-nowrap"
          aria-label="Demo sections"
        >
          {DEMOS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => select(id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                active === id
                  ? 'border-orange-500/60 bg-orange-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-orange-400" />
              {label}
            </button>
          ))}
        </nav>

        <section className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">{current.label}</h2>
              <p className="mt-1 text-sm text-zinc-400">{current.short}</p>
            </div>
            <Link
              href={current.href}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              {current.hrefLabel}
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            {active === 'crm' && <CrmPreview />}
            {active === 'content' && <ContentPreview />}
            {active === 'ai' && <AiPreview />}
            {active === 'calling' && <CallingPreview />}
            {active === 'automation' && <AutomationPreview />}
            {active === 'video' && <VideoPreview />}
            {active === 'marketing' && <MarketingPreview />}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-8">
            <Link href="/integrations" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
              Integrations →
            </Link>
            <Link href="/analytics" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
              Analytics →
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
              Dashboard →
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-zinc-400 hover:text-white">
              Talk to sales
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
