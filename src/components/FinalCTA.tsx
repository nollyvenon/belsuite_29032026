'use client';

import { FadeIn } from './FadeIn';
import { ArrowRight } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <section className="py-24 lg:py-32">
      <div className="container px-4 mx-auto">
        <FadeIn>
          <div className="relative p-12 overflow-hidden text-center border rounded-3xl lg:p-24 dark:border-white/10 border-black/10 bg-primary/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[100px] rounded-full -z-10" />
            
            <h2 className="max-w-3xl mx-auto mb-8 text-4xl font-bold md:text-6xl font-display">
              Ready to scale your content to the moon?
            </h2>
            <p className="max-w-xl mx-auto mb-12 text-lg text-gray-600 dark:text-gray-400">
              Join 10,000+ creators and brands who are already using Belsuite to dominate their niche.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="flex items-center gap-2 px-10 py-5 text-xl font-bold text-white transition-all rounded-full bg-primary hover:orange-glow group">
                Start Your Free Trial
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-500">No credit card required • Cancel anytime • 14-day free trial</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
