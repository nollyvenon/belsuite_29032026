'use client';

import { FadeIn } from './FadeIn';
import { XCircle, CheckCircle2 } from 'lucide-react';

export const ProblemSolution = () => {
  return (
    <section className="py-24 lg:py-32 bg-black text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full -z-10" />
      
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
          <FadeIn direction="right">
            <h2 className="mb-8 text-4xl font-bold md:text-6xl font-display leading-tight">
              Stop wasting hours on <span className="text-primary">manual</span> marketing.
            </h2>
            <p className="mb-10 text-xl text-gray-400">
              The old way of creating content is dead. Juggling multiple tools, expensive agencies, and inconsistent posting schedules is holding you back.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Too many tools</h4>
                  <p className="text-gray-400">Paying for 10+ subscriptions that don&apos;t talk to each other.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Creative Burnout</h4>
                  <p className="text-gray-400">Staring at a blank screen trying to figure out what to post next.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Zero ROI</h4>
                  <p className="text-gray-400">Spending thousands on ads and content with no predictable growth.</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left" className="relative">
            <div className="p-8 md:p-12 border rounded-3xl border-primary/30 bg-primary/5 backdrop-blur-xl">
              <h3 className="mb-8 text-3xl font-bold font-display">The Belsuite Way</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">All-in-One Intelligence</h4>
                    <p className="text-gray-400">One platform to generate, edit, schedule, and automate everything.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Infinite Creativity</h4>
                    <p className="text-gray-400">AI that knows your brand and generates viral-ready content 24/7.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Predictable Scaling</h4>
                    <p className="text-gray-400">Data-driven marketing that optimizes your budget and maximizes reach.</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-10 py-4 text-lg font-bold text-white rounded-full bg-primary hover:orange-glow transition-all">
                Switch to Belsuite Today
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
