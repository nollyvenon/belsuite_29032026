'use client';

import Link from 'next/link';
import { Scissors, Sparkles, Video } from 'lucide-react';

export default function AIVideoEditorPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-sm text-orange-300">
            <Scissors className="h-4 w-4" />
            AI Video Editor
          </div>
          <h1 className="mt-4 text-4xl font-bold">A CapCut-style editing surface on top of the video engine.</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            This page is a clearer product entry point for the existing video studio, keeping the underlying editor, renders, and project management intact.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/video" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-black">
              Open video studio
            </Link>
            <Link href="/content" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Back to content system
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Video className="h-5 w-5 text-orange-300" /> Shared flow</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Editing should remain connected to content generation, scheduling, analytics, and UGC so it functions as part of a growth workflow rather than a separate tool.
          </p>
        </section>
      </div>
    </main>
  );
}
