'use client';

import { FadeIn } from './FadeIn';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: "Starter",
    price: "49",
    description: "Perfect for solo creators and entrepreneurs starting their journey.",
    features: ["10 AI Video Credits", "Unlimited Content Generation", "3 Social Accounts", "Basic Analytics"],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Pro",
    price: "99",
    description: "The ultimate suite for growing brands and content creators.",
    features: ["50 AI Video Credits", "Advanced Ad Engine", "10 Social Accounts", "Advanced Analytics", "UGC Creator Access"],
    cta: "Get Started Now",
    popular: true
  },
  {
    name: "Business",
    price: "249",
    description: "Enterprise-grade power for agencies and large marketing teams.",
    features: ["Unlimited AI Videos", "Full Campaign Automation", "Unlimited Accounts", "Custom API Access", "Priority Support"],
    cta: "Contact Sales",
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-black/5 dark:bg-white/5">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <FadeIn>
            <h2 className="mb-6 text-4xl font-bold md:text-6xl font-display">Simple, transparent pricing.</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Choose the plan that fits your scale. No hidden fees.</p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1} className="relative">
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 text-xs font-bold text-white uppercase rounded-full bg-primary">
                  Most Popular
                </div>
              )}
              <div className={`h-full p-10 border rounded-3xl flex flex-col ${plan.popular ? 'border-primary bg-white dark:bg-black shadow-2xl scale-105 z-10' : 'dark:border-white/10 border-black/10 bg-white/50 dark:bg-black/50'}`}>
                <div className="mb-8">
                  <h3 className="mb-2 text-2xl font-bold font-display">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold font-display">${plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                <div className="flex-grow space-y-4 mb-10">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <a href="/billing" className={`block w-full py-4 text-center font-bold rounded-full transition-all ${plan.popular ? 'bg-primary text-white hover:orange-glow' : 'border dark:border-white/10 border-black/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  {plan.cta}
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
