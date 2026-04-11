'use client';

import Link from 'next/link';
import { ArrowRight, Play, CheckCircle, BarChart3, Phone, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    title: 'CRM + Deals',
    body: 'Track leads, pipeline, and next actions in one system.',
    icon: BarChart3,
  },
  {
    title: 'AI Calling',
    body: 'Follow up, qualify, and book meetings automatically.',
    icon: Phone,
  },
  {
    title: 'Content System',
    body: 'Generate content, video, and campaigns fast.',
    icon: Sparkles,
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-3">Live Demo</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">See Belsuite working as one system</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">CRM, content, automation, calling, and analytics in one flow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ title, body, icon: Icon }) => (
            <div key={title} className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-orange-50/50 dark:bg-orange-900/10">
              <Icon className="w-6 h-6 text-orange-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">{title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/billing" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-orange-500 text-white font-bold">
            Start Free Trial <ArrowRight size={18} />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-black/10 dark:border-white/10 font-bold">
            <Play size={18} /> Talk to Sales
          </Link>
        </div>
      </section>
    </main>
  );
}
'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Play } from 'lucide-react';

const DEMO_POINTS = [
  'CRM and deals stay in sync with AI actions',
  'Calling, automation, and integrations share one event stream',
  'Marketing, video, and SEO feed back into the same growth loop',
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-sm font-semibold text-orange-400">Demo</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">See how Belsuite runs as one operating system</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-300">
          This page shows the product story. The live product pages handle the real workflows, while this demo stays lightweight and conversion-focused.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {DEMO_POINTS.map((point) => (
            <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="mt-3 text-sm text-zinc-200">{point}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 font-semibold text-white/90">
            <Play className="h-4 w-4" /> Talk to Sales
          </Link>
        </div>
      </section>
    </main>
  );
}
