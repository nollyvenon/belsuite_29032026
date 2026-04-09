'use client';

import { motion } from 'motion/react';
import { FadeIn } from './FadeIn';
import { Lightbulb, Wand2, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: <Lightbulb className="w-7 h-7" />,
    title: 'Drop your idea or brief',
    description:
      'Type a prompt, paste a URL, or upload a rough draft. Belsuite reads your brand kit and understands your tone, audience, and goals instantly.',
    items: ['Brand voice learning', 'Competitor research', 'Trend analysis'],
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
  },
  {
    number: '02',
    icon: <Wand2 className="w-7 h-7" />,
    title: 'AI creates everything',
    description:
      'In seconds, Belsuite generates platform-optimized videos, images, copy, and ad creatives. All formats. All channels. All at once.',
    items: ['Videos, images & copy', '50+ format variations', 'AI creative testing'],
    color: 'from-primary to-orange-500',
    glow: 'shadow-primary/20',
  },
  {
    number: '03',
    icon: <Rocket className="w-7 h-7" />,
    title: 'Publish, automate & scale',
    description:
      'Auto-publish to every platform at peak engagement times. Campaigns run themselves. Analytics report back. You scale without the grind.',
    items: ['Auto-post to 12 platforms', 'AI budget optimization', 'Performance autopilot'],
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-36 bg-black/3 dark:bg-white/2 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full" />

      <div className="container px-4 mx-auto relative">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-primary/8 border border-primary/20 text-primary">
              <Rocket className="w-3.5 h-3.5" />
              From idea to viral in minutes
            </div>
            <h2 className="mb-5 text-4xl font-extrabold md:text-6xl font-display leading-tight">
              Three steps to{' '}
              <span className="text-gradient">unstoppable</span>{' '}
              content.
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              We&apos;ve eliminated every bottleneck between your idea and the feed. No learning curve. No agency needed.
            </p>
          </FadeIn>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[16.667%] right-[16.667%] h-[2px] bg-gradient-to-r from-violet-500/30 via-primary/50 to-emerald-500/30 -translate-y-1/2" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
            {STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex flex-col"
                >
                  {/* Step number circle */}
                  <div className="flex justify-center lg:justify-start mb-8 relative z-10">
                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-2xl ${step.glow}`}>
                      {step.icon}
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-[#0D0D0D]`}>
                        {i + 1}
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 p-7 rounded-3xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60 hover:border-primary/20 transition-all">
                    <div className="text-xs font-black text-gray-300 dark:text-gray-700 font-display mb-3 tracking-widest">
                      STEP {step.number}
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3 leading-tight">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                      {step.description}
                    </p>

                    {/* Checklist */}
                    <ul className="space-y-2.5">
                      {step.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow between steps (mobile) */}
                  {i < STEPS.length - 1 && (
                    <div className="flex justify-center lg:hidden mt-4 text-gray-300 dark:text-gray-700">
                      <ArrowRight className="w-6 h-6 rotate-90" />
                    </div>
                  )}
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Bottom proof */}
        <FadeIn delay={0.4}>
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400 mb-6">Average time from signup to first published content:</p>
            <div className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60">
              <div className="text-center">
                <div className="text-3xl font-extrabold font-display text-gradient">8 minutes</div>
                <div className="text-xs text-gray-400 mt-1">From signup → first live post</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
