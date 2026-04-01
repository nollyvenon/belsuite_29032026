'use client';

import { FadeIn } from './FadeIn';
import { Lightbulb, Rocket, BarChart } from 'lucide-react';

const STEPS = [
  {
    icon: <Lightbulb className="w-8 h-8" />,
    title: "Input your idea",
    description: "Just type a simple prompt or upload a rough draft. Our AI understands your brand voice instantly."
  },
  {
    icon: <Rocket className="w-8 h-8" />,
    title: "AI generates content",
    description: "In seconds, Belsuite creates high-quality videos, images, and copy tailored for every platform."
  },
  {
    icon: <BarChart className="w-8 h-8" />,
    title: "Publish & Scale",
    description: "Auto-publish to all your socials and watch your engagement soar with AI-driven optimization."
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <FadeIn>
            <h2 className="mb-6 text-4xl font-bold md:text-6xl font-display">From idea to viral in 3 steps.</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">We&apos;ve simplified the complex content creation process into a seamless, AI-powered workflow.</p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <FadeIn key={i} delay={i * 0.2} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-[2px] bg-gradient-to-r from-primary/50 to-transparent -z-10" />
              )}
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-8 text-white rounded-full bg-primary orange-glow">
                {step.icon}
              </div>
              <h3 className="mb-4 text-2xl font-bold font-display">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
