'use client';

import { FadeIn } from './FadeIn';

const LOGOS = [
  "Shopify", "Stripe", "Notion", "Linear", "Apple", "Google", "Meta", "TikTok"
];

export const SocialProof = () => {
  return (
    <section className="py-20 border-y dark:border-white/5 border-black/5">
      <div className="container px-4 mx-auto">
        <p className="mb-12 text-sm font-semibold tracking-widest text-center uppercase text-gray-500">
          Trusted by 10,000+ creators and brands worldwide
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
          {LOGOS.map((logo, i) => (
            <FadeIn key={logo} delay={i * 0.1} direction="up">
              <span className="text-2xl font-bold tracking-tighter md:text-3xl font-display">{logo}</span>
            </FadeIn>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 mt-20 md:grid-cols-3">
          <FadeIn delay={0.1} className="p-8 text-center border rounded-2xl dark:border-white/5 border-black/5 bg-white/50 dark:bg-black/50">
            <div className="mb-2 text-4xl font-bold font-display text-primary">2M+</div>
            <div className="text-gray-500">Posts Generated</div>
          </FadeIn>
          <FadeIn delay={0.2} className="p-8 text-center border rounded-2xl dark:border-white/5 border-black/5 bg-white/50 dark:bg-black/50">
            <div className="mb-2 text-4xl font-bold font-display text-primary">10k+</div>
            <div className="text-gray-500">Active Creators</div>
          </FadeIn>
          <FadeIn delay={0.3} className="p-8 text-center border rounded-2xl dark:border-white/5 border-black/5 bg-white/50 dark:bg-black/50">
            <div className="mb-2 text-4xl font-bold font-display text-primary">99.9%</div>
            <div className="text-gray-500">Uptime Reliability</div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
