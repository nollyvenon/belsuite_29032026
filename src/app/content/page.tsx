'use client';

import Link from 'next/link';
import { FileText, Image as ImageIcon, Video, CalendarClock, Megaphone, BarChart3 } from 'lucide-react';

const sections = [
  { label: 'Text + scripts', href: '/ai/generate', icon: FileText },
  { label: 'Images + visuals', href: '/marketing', icon: ImageIcon },
  { label: 'Video editing', href: '/video', icon: Video },
  { label: 'Scheduling', href: '/social', icon: CalendarClock },
  { label: 'UGC', href: '/ugc', icon: Megaphone },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function ContentSuitePage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-bold">Content Creation System</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            One surface for text, images, videos, scheduling, UGC, and campaign feedback. Each area links into the existing production modules instead of duplicating them.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-lg font-semibold">{label}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
