'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { FadeIn } from './FadeIn';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-32">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      
      <div className="container px-4 mx-auto text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium border rounded-full bg-primary/5 border-primary/20 text-primary">
            <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />
            New: AI Ad Generator is now live
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="max-w-4xl mx-auto mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl font-display">
            Scale your content <br />
            <span className="text-gradient">with AI intelligence.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="max-w-2xl mx-auto mb-10 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
            Create, automate, and scale your content and marketing with AI — all in one platform. Built for creators, agencies, and brands who want to dominate.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="flex items-center gap-2 px-8 py-4 text-lg font-bold text-white transition-all rounded-full bg-primary hover:orange-glow group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="/demo"
              className="flex items-center gap-2 px-8 py-4 text-lg font-bold transition-all border rounded-full dark:border-white/10 border-black/10 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Play className="w-5 h-5 fill-current" />
              View Live Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required. 14-day free trial.</p>
        </FadeIn>

        <FadeIn delay={0.5} className="mt-20">
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-3xl" />
            <div className="overflow-hidden border shadow-2xl rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <Image
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="Belsuite Dashboard Preview" 
                width={1200}
                height={800}
                className="w-full h-auto opacity-90"
                referrerPolicy="no-referrer"
                unoptimized
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
