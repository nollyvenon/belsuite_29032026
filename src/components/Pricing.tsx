'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { FadeIn } from './FadeIn';
import { Check, Zap, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: '49',
    yearlyPrice: '39',
    description: 'Perfect for solo creators and entrepreneurs ready to level up their content game.',
    features: [
      '10 AI Video Credits / month',
      'Unlimited AI Copy Generation',
      '3 Social Media Accounts',
      'Basic Analytics Dashboard',
      'Auto-Post Scheduling',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    href: '/billing',
    popular: false,
    color: '',
  },
  {
    name: 'Pro',
    monthlyPrice: '99',
    yearlyPrice: '79',
    description: 'The ultimate AI content suite for growing brands and serious content creators.',
    features: [
      '50 AI Video Credits / month',
      'AI Ad Engine & Campaign Automation',
      '10 Social Media Accounts',
      'Advanced Analytics & AI Insights',
      'UGC Creator Access',
      'A/B Creative Testing',
      'Priority Support',
    ],
    cta: 'Get Started — Most Popular',
    href: '/billing',
    popular: true,
    color: 'border-primary',
  },
  {
    name: 'Business',
    monthlyPrice: '249',
    yearlyPrice: '199',
    description: 'Enterprise-grade power for agencies, large brands, and high-volume marketing teams.',
    features: [
      'Unlimited AI Video Credits',
      'Full Campaign Autopilot',
      'Unlimited Social Accounts',
      'Custom API & Webhook Access',
      'White-label Option',
      'Multi-user Team Workspace',
      'Dedicated Account Manager',
    ],
    cta: 'Contact Sales',
    href: '/billing',
    popular: false,
    color: '',
  },
];

export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-36 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full" />

      <div className="container px-4 mx-auto relative">

        {/* Header */}
        <div className="max-w-3xl mx-auto mb-14 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-primary/8 border border-primary/20 text-primary">
              <Zap className="w-3.5 h-3.5" />
              Simple, transparent pricing
            </div>
            <h2 className="mb-5 text-4xl font-extrabold md:text-6xl font-display leading-tight">
              Choose your{' '}
              <span className="text-gradient">scaling speed.</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No hidden fees. No surprises. Cancel anytime.
            </p>
          </FadeIn>

          {/* Billing toggle */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-4 mt-8 p-1.5 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!isYearly ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${isYearly ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Yearly
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isYearly ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'}`}>
                  Save 20%
                </span>
              </button>
            </div>
          </FadeIn>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5 items-stretch">
          {PLANS.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className={`relative h-full flex flex-col p-8 rounded-3xl border transition-all ${
                plan.popular
                  ? 'border-primary bg-white dark:bg-zinc-900 shadow-2xl shadow-primary/10 lg:scale-105 z-10'
                  : 'dark:border-white/8 border-black/8 bg-white/70 dark:bg-zinc-900/60 hover:border-primary/30 hover:shadow-xl'
              }`}>

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wide shadow-lg orange-glow-sm whitespace-nowrap">
                    ⚡ Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold font-display mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <motion.span
                      key={isYearly ? 'yearly' : 'monthly'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-black font-display"
                    >
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </motion.span>
                    <span className="text-gray-400 text-sm">/mo</span>
                    {isYearly && (
                      <span className="ml-1 text-[10px] font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                        SAVE 20%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="flex-grow space-y-3.5 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-primary' : 'bg-primary/10'}`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={plan.href}
                  className={`flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold rounded-2xl transition-all group ${
                    plan.popular
                      ? 'bg-primary text-white hover:brightness-110 orange-glow'
                      : 'border dark:border-white/10 border-black/10 hover:bg-black/4 dark:hover:bg-white/4'
                  }`}
                >
                  {plan.cta}
                  {plan.popular && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </motion.a>

                {plan.popular && (
                  <p className="text-center text-[11px] text-gray-400 mt-3">
                    14-day free trial • No credit card required
                  </p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom note */}
        <FadeIn delay={0.3}>
          <div className="mt-14 text-center">
            <p className="text-sm text-gray-400">
              All plans include a{' '}
              <strong className="text-[#0D0D0D] dark:text-white">14-day free trial</strong>.{' '}
              Need a custom plan for a large team?{' '}
              <a href="mailto:sales@belsuite.ai" className="text-primary font-semibold hover:underline">
                Talk to sales →
              </a>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
