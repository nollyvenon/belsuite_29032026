'use client';

import Link from 'next/link';
import { Megaphone, Sparkles, Share2, Video } from 'lucide-react';

const capabilities = [
  'Generate trend-aligned content concepts',
  'Spin outputs into posts, reels, and short-form video',
  'Use UGC and analytics to refine messaging',
  'Push content into scheduling and campaign systems',
];

export default function AIInfluencerPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-sm text-pink-300">
            <Megaphone className="h-4 w-4" />
            AI Influencer
          </div>
          <h1 className="mt-4 text-4xl font-bold">A growth personality built from content, UGC, and analytics.</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            This surface turns the content engine into an audience-facing growth operator that can create, adapt, and publish with performance feedback from the rest of the platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/social" className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-black">
              Open social scheduler
            </Link>
            <Link href="/ugc" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Open UGC studio
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
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Share2 className="h-5 w-5 text-pink-300" /> Shared flow</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Influencer output should feed scheduling, campaign planning, and analytics so the brand voice is measurable and connected to growth outcomes.
          </p>
        </section>
      </div>
    </main>
  );
}
