'use client';

import { motion } from 'motion/react';
import { FadeIn } from './FadeIn';
import { ArrowRight, Star, CheckCircle2, Zap } from 'lucide-react';

const AVATARS = [
  { initials: 'SC', color: 'bg-purple-500' },
  { initials: 'MW', color: 'bg-blue-500' },
  { initials: 'PK', color: 'bg-primary' },
  { initials: 'JL', color: 'bg-emerald-500' },
  { initials: 'AR', color: 'bg-pink-500' },
];

export const FinalCTA = () => {
  return (
    <section className="py-24 lg:py-36 relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50 dark:opacity-30" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/8 blur-[180px] rounded-full" />

      <div className="container px-4 mx-auto relative">
        <FadeIn>
          <div className="relative max-w-4xl mx-auto text-center p-12 md:p-20 rounded-[2.5rem] overflow-hidden border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900/80 shadow-2xl">

            {/* Ambient glow inside card */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />

            {/* Badge */}
            <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 text-xs font-bold rounded-full bg-primary/8 border border-primary/20 text-primary">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              Join 10,000+ creators already scaling
            </div>

            {/* Headline */}
            <h2 className="relative max-w-3xl mx-auto mb-6 text-4xl font-extrabold md:text-6xl font-display leading-tight">
              Stop watching competitors<br />
              <span className="text-gradient">outpace you.</span><br />
              Start today.
            </h2>

            {/* Subtext */}
            <p className="relative max-w-xl mx-auto mb-10 text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Every day without Belsuite is another day your competitors are creating more content, running better ads, and capturing your audience. The window is closing.
            </p>

            {/* CTAs */}
            <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row mb-8">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 px-10 py-4 text-base font-bold text-white rounded-full bg-primary animate-glow-pulse hover:brightness-110 transition-all group"
              >
                Start Your Free Trial Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <a
                href="/demo"
                className="flex items-center gap-2 px-8 py-4 text-base font-bold rounded-full border dark:border-white/12 border-black/10 hover:bg-black/4 dark:hover:bg-white/4 transition-all"
              >
                Watch Demo First
              </a>
            </div>

            {/* Trust indicators */}
            <div className="relative flex flex-wrap items-center justify-center gap-5 mb-10 text-xs text-gray-400">
              {[
                '14-day free trial',
                'No credit card required',
                'Cancel anytime',
                'Setup in 8 minutes',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>

            {/* Social proof row */}
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t dark:border-white/6 border-black/6">
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                {AVATARS.map((a, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full ${a.color} border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    {a.initials}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[9px] font-bold text-gray-500">
                  +9K
                </div>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-primary fill-primary" />
                  ))}
                  <span className="text-xs font-bold ml-1">4.9/5</span>
                </div>
                <div className="text-xs text-gray-400">
                  from <strong className="text-[#0D0D0D] dark:text-white">10,000+</strong> creators and agencies worldwide
                </div>
              </div>
            </div>

          </div>
        </FadeIn>
      </div>
    </section>
  );
};
