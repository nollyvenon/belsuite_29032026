'use client';

import { motion } from 'motion/react';
import { FadeIn } from './FadeIn';
import {
  Sparkles, Video, Share2, BarChart3, Target, Users,
  Wand2, Clock, Globe, Zap, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    label: 'AI Content',
    title: 'AI Content Generator',
    description:
      'Generate high-converting blog posts, social captions, email sequences, and scripts in seconds. Trained on 10B+ words of top-performing content.',
    metric: '10x faster',
    metricLabel: 'than manual writing',
    color: 'from-violet-500/20 to-purple-500/10',
    iconBg: 'bg-violet-500/10 text-violet-500',
    hoverBorder: 'hover:border-violet-500/30',
  },
  {
    icon: <Video className="w-6 h-6" />,
    label: 'AI Video',
    title: 'AI Video Creator & Editor',
    description:
      'Turn any text or script into a stunning video. Auto-caption, add B-roll, enhance audio, and export in platform-perfect formats — all automatically.',
    metric: '50+ formats',
    metricLabel: 'Instagram, TikTok, YouTube & more',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-blue-500/10 text-blue-500',
    hoverBorder: 'hover:border-blue-500/30',
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    label: 'Auto Post',
    title: 'Smart Auto Posting',
    description:
      'Schedule and auto-post to every major platform simultaneously. AI analyzes your audience and picks the exact right time to maximize reach.',
    metric: '12 platforms',
    metricLabel: 'all connected in one click',
    color: 'from-emerald-500/20 to-green-500/10',
    iconBg: 'bg-emerald-500/10 text-emerald-500',
    hoverBorder: 'hover:border-emerald-500/30',
  },
  {
    icon: <Target className="w-6 h-6" />,
    label: 'AI Ads',
    title: 'AI Ads Engine',
    description:
      'Create 50+ ad variations in minutes. AI tests them automatically, kills losers, doubles down on winners. Launch full campaigns on Meta, Google & TikTok.',
    metric: '3.2x avg ROAS',
    metricLabel: 'across all campaigns',
    color: 'from-primary/20 to-orange-400/10',
    iconBg: 'bg-primary/10 text-primary',
    hoverBorder: 'hover:border-primary/40',
    featured: true,
  },
  {
    icon: <Users className="w-6 h-6" />,
    label: 'UGC',
    title: 'UGC Content Creator',
    description:
      'Generate authentic user-generated content style videos without real users. AI-powered avatars and voices that actually convert.',
    metric: '40% higher CTR',
    metricLabel: 'vs. branded creative',
    color: 'from-pink-500/20 to-rose-500/10',
    iconBg: 'bg-pink-500/10 text-pink-500',
    hoverBorder: 'hover:border-pink-500/30',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    label: 'Analytics',
    title: 'Advanced Analytics',
    description:
      'Deep performance insights across every platform, campaign, and content piece. AI surfaces what\'s working and auto-reallocates your focus.',
    metric: 'Real-time',
    metricLabel: 'dashboards & AI insights',
    color: 'from-amber-500/20 to-yellow-500/10',
    iconBg: 'bg-amber-500/10 text-amber-500',
    hoverBorder: 'hover:border-amber-500/30',
  },
];

const EXTRA_FEATURES = [
  { icon: <Wand2 className="w-4 h-4" />,  text: 'AI Brand Voice Training' },
  { icon: <Clock className="w-4 h-4" />,  text: 'Optimal Post-Time AI' },
  { icon: <Globe className="w-4 h-4" />,  text: 'Multi-language Support' },
  { icon: <Zap className="w-4 h-4" />,    text: 'Instant Content Repurposing' },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 lg:py-36 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/4 blur-[180px] rounded-full" />

      <div className="container px-4 mx-auto relative">

        {/* Header */}
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-primary/8 border border-primary/20 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Everything you need, nothing you don&apos;t
            </div>
            <h2 className="mb-5 text-4xl font-extrabold md:text-6xl font-display leading-tight">
              One platform to{' '}
              <span className="text-gradient">dominate</span>{' '}
              every channel.
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Stop juggling 10 different tools. Belsuite brings your entire content
              and marketing workflow into one powerful AI command center.
            </p>
          </FadeIn>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative h-full p-7 rounded-3xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60 transition-all cursor-default ${feature.hoverBorder} hover:shadow-xl dark:hover:shadow-black/40 group overflow-hidden`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />

                {/* Featured badge */}
                {feature.featured && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wide">
                    Most Used
                  </div>
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 mb-5 rounded-2xl ${feature.iconBg} group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>

                  {/* Label */}
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{feature.label}</div>

                  {/* Title */}
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* Metric */}
                  <div className="flex items-center gap-2 pt-4 border-t dark:border-white/6 border-black/6">
                    <span className="text-base font-extrabold font-display text-primary">{feature.metric}</span>
                    <span className="text-xs text-gray-400">{feature.metricLabel}</span>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Extra features chips */}
        <FadeIn delay={0.3}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            <span className="text-sm text-gray-500">Also included:</span>
            {EXTRA_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/4 dark:bg-white/4 border border-black/6 dark:border-white/6 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-primary">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* CTA under features */}
        <FadeIn delay={0.35}>
          <div className="mt-16 text-center">
            <a href="#pricing" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group">
              See all features & pricing
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
