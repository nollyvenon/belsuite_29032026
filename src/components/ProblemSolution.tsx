'use client';

import { FadeIn } from './FadeIn';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const PROBLEMS = [
  {
    title: 'Tool overload & wasted budget',
    desc: 'You\'re paying $1,200+/month across Canva, Jasper, Buffer, AdCreative, Hootsuite — and they don\'t even talk to each other.',
  },
  {
    title: 'Creative burnout & inconsistency',
    desc: 'Staring at a blank screen, scrambling for ideas, missing posting windows. Competitors are posting while you\'re still brainstorming.',
  },
  {
    title: 'Campaigns with zero predictable ROI',
    desc: 'You\'re spending thousands on ads with gut-feel creative. No data-driven testing. No feedback loop. No growth.',
  },
  {
    title: 'Can\'t scale without hiring',
    desc: 'Every piece of content requires manual effort. Growing means hiring — more cost, more complexity, slower execution.',
  },
];

const SOLUTIONS = [
  {
    title: 'One platform. Everything included.',
    desc: 'Replace 10+ tools with a single AI-powered command center. Content, video, ads, scheduling — all unified.',
  },
  {
    title: 'Infinite AI creativity, 24/7.',
    desc: 'AI trained on viral content learns your brand voice. Never run out of ideas. Post 3x/day without lifting a finger.',
  },
  {
    title: 'Data-driven ad campaigns that actually convert.',
    desc: 'AI generates 50+ ad variants, auto-tests them, and doubles down on what works. Predictable, scalable ROAS.',
  },
  {
    title: 'Scale to 10x without a team.',
    desc: 'Automate your entire content pipeline. One creator can now do the work of a 10-person marketing department.',
  },
];

export const ProblemSolution = () => {
  return (
    <section className="py-24 lg:py-36 bg-[#0D0D0D] text-white overflow-hidden relative">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[160px] rounded-full" />
      <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/5 blur-[100px] rounded-full" />

      <div className="container px-4 mx-auto relative z-10">

        {/* Section header */}
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              The old way is broken
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold font-display leading-tight mb-6">
              Stop losing to brands with{' '}
              <span className="text-primary">bigger teams</span>{' '}
              and{' '}
              <span className="text-primary">bigger budgets.</span>
            </h2>
            <p className="text-lg text-gray-400">
              You don&apos;t need more tools. You need smarter ones. Here&apos;s the honest breakdown.
            </p>
          </div>
        </FadeIn>

        {/* Problem → Solution comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* Problems column */}
          <FadeIn direction="right">
            <div className="rounded-3xl border border-red-500/15 bg-red-500/5 overflow-hidden">
              <div className="px-8 py-5 border-b border-red-500/15 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Without Belsuite</span>
                </div>
              </div>
              <div className="p-8 space-y-8">
                {PROBLEMS.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1.5 text-white/90">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Solutions column */}
          <FadeIn direction="left">
            <div className="rounded-3xl border border-primary/25 bg-primary/4 overflow-hidden">
              <div className="px-8 py-5 border-b border-primary/20 bg-primary/8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">With Belsuite</span>
                </div>
              </div>
              <div className="p-8 space-y-8">
                {SOLUTIONS.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1.5 text-white">{item.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 pb-8">
                <a href="/billing" className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white rounded-2xl bg-primary hover:brightness-110 transition-all orange-glow group">
                  Switch to Belsuite Today — Free for 14 Days
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Bottom stat bar */}
        <FadeIn delay={0.2}>
          <div className="mt-16 p-6 md:p-8 rounded-3xl border border-white/6 bg-white/4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold font-display text-primary mb-1">80%</div>
              <div className="text-sm text-gray-400">Time saved on content creation</div>
            </div>
            <div className="sm:border-x border-white/8">
              <div className="text-3xl font-extrabold font-display text-primary mb-1">$1,400</div>
              <div className="text-sm text-gray-400">Average monthly savings vs. separate tools</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-display text-primary mb-1">6.8x</div>
              <div className="text-sm text-gray-400">Average ROAS improvement in 60 days</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
