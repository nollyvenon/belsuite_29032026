'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from './FadeIn';
import {
  Sparkles, Video, Share2, BarChart3,
  Play, CheckCircle2, TrendingUp, Zap, Clock, ChevronRight,
} from 'lucide-react';

const TABS = [
  {
    id: 'ai-content',
    label: 'AI Content',
    icon: <Sparkles className="w-4 h-4" />,
    tagline: 'Generate a month of content in 10 minutes',
  },
  {
    id: 'video',
    label: 'AI Video',
    icon: <Video className="w-4 h-4" />,
    tagline: 'Text-to-video in under 60 seconds',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    tagline: 'Know exactly what\'s driving growth',
  },
  {
    id: 'autopilot',
    label: 'Auto Post',
    icon: <Share2 className="w-4 h-4" />,
    tagline: 'Schedule once. Post everywhere.',
  },
];

/* ── Tab Panels ── */
const AIContentPanel = () => (
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
    {/* Prompt input */}
    <div className="lg:col-span-2 flex flex-col gap-3">
      <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Your prompt</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed p-3 rounded-xl bg-black/3 dark:bg-white/3 border dark:border-white/5 border-black/5">
          Write 5 Instagram captions for our new Wireless Headphones launch. Audience: young professionals 25-34. Tone: premium but fun. Include emojis and a CTA.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Generate Now
          </button>
          <button className="px-3 py-2.5 rounded-xl border dark:border-white/10 border-black/10 text-xs font-medium">
            Templates
          </button>
        </div>
      </div>
      <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Settings</div>
        {[
          { label: 'Platform', value: 'Instagram' },
          { label: 'Tone', value: 'Premium & Fun' },
          { label: 'Length', value: 'Medium (150 words)' },
          { label: 'Brand Voice', value: 'Your Voice ✓' },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between py-2 border-b dark:border-white/4 border-black/4 last:border-0 text-xs">
            <span className="text-gray-400">{s.label}</span>
            <span className="font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Generated results */}
    <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto max-h-80 lg:max-h-none">
      {[
        {
          num: '01',
          text: '🎧 Your commute just got a serious upgrade. Introducing our new Wireless Pro — 40hr battery, noise cancellation that actually works, and a sound signature audiophiles swear by. First 500 orders get 20% off. Tap the link. →',
          reach: '24.2K est. reach',
          score: '94',
        },
        {
          num: '02',
          text: '✨ We obsessed over every detail so you don\'t have to think — just listen. The Wireless Pro is here. Premium sound. All-day comfort. Zero wires holding you back. Grab yours before they\'re gone. 🔗 in bio.',
          reach: '18.7K est. reach',
          score: '88',
        },
        {
          num: '03',
          text: '🚀 Big drop alert. Our most-requested product is finally here — and early access is only open for 72 hours. The Wireless Pro. Sound you feel, not just hear. Link in bio. #AudioPhile #WirelessLife',
          reach: '31.5K est. reach',
          score: '97',
        },
      ].map((item) => (
        <div key={item.num} className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900 group hover:border-primary/30 transition-colors cursor-pointer">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 font-display">Caption {item.num}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">{item.reach}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(item.score) > 90 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                Score: {item.score}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{item.text}</p>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 rounded-lg bg-primary text-white text-[10px] font-bold">Use this</button>
            <button className="px-3 py-1 rounded-lg border dark:border-white/10 border-black/10 text-[10px] font-medium">Schedule</button>
            <button className="px-3 py-1 rounded-lg border dark:border-white/10 border-black/10 text-[10px] font-medium">Refine</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VideoPanel = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
    <div className="flex flex-col gap-3">
      <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Script or topic</div>
        <div className="text-sm p-3 rounded-xl bg-black/3 dark:bg-white/3 border dark:border-white/5 border-black/5 text-gray-700 dark:text-gray-300 mb-3">
          Create a 30-second TikTok video showing the top 3 benefits of our product launch using a trending hook.
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['TikTok 9:16', 'IG Reel', 'YT Short'].map((fmt) => (
            <button key={fmt} className={`py-2 rounded-xl text-[10px] font-bold border transition-colors ${fmt === 'TikTok 9:16' ? 'border-primary bg-primary/8 text-primary' : 'border-black/10 dark:border-white/10'}`}>
              {fmt}
            </button>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
          <Video className="w-3.5 h-3.5" />
          Generate Video
        </button>
      </div>

      <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold mb-3">AI enhancements</div>
        {[
          { label: 'Auto-captions', on: true },
          { label: 'Background music', on: true },
          { label: 'B-roll suggestions', on: true },
          { label: 'Hook optimization', on: true },
        ].map((feat) => (
          <div key={feat.label} className="flex items-center justify-between py-2 text-xs border-b dark:border-white/4 border-black/4 last:border-0">
            <span>{feat.label}</span>
            <span className={`w-7 h-4 rounded-full flex items-center justify-end pr-0.5 ${feat.on ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <span className="w-3 h-3 rounded-full bg-white shadow" />
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-3">
      {/* Video preview */}
      <div className="flex-1 rounded-2xl border dark:border-white/8 border-black/8 bg-zinc-900 flex items-center justify-center aspect-video lg:aspect-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20" />
        <div className="text-center z-10">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-white/20 transition-colors border border-white/20">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
          <div className="text-white text-xs font-semibold">Preview ready</div>
          <div className="text-white/50 text-[10px] mt-1">30s • TikTok 9:16 • 1080p</div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-white/20">
            <div className="w-2/5 h-full rounded-full bg-primary" />
          </div>
          <span className="text-white text-[10px]">0:12 / 0:30</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">Download</button>
        <button className="flex-1 py-2.5 rounded-xl border dark:border-white/10 border-black/10 text-xs font-medium">Schedule Post</button>
      </div>
    </div>
  </div>
);

const AnalyticsPanel = () => {
  const bars = [55, 70, 45, 85, 60, 92, 78, 88, 65, 95, 80, 100];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Reach', value: '2.4M', change: '+24%', color: 'text-emerald-500' },
            { label: 'Engagement', value: '8.7%',  change: '+3.1%', color: 'text-blue-500' },
            { label: 'Revenue Attr.', value: '$48.2K', change: '+31%', color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-xl font-extrabold font-display">{s.value}</div>
              <div className={`text-xs font-bold ${s.color}`}>{s.change} ↑</div>
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold">Content Performance Trend</div>
            <div className="text-[10px] text-gray-400">Last 12 weeks</div>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                style={{ height: `${h}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? 'bg-primary' : i > 8 ? 'bg-primary/50' : 'bg-primary/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
          <div className="text-xs font-semibold mb-3">Top performing content</div>
          {[
            { platform: 'Instagram', title: 'Product launch reel', reach: '41.9K', icon: 'bg-pink-500' },
            { platform: 'TikTok',    title: 'Behind the scenes',   reach: '38.2K', icon: 'bg-black' },
            { platform: 'YouTube',   title: 'Tutorial video',      reach: '24.6K', icon: 'bg-red-500' },
          ].map((p) => (
            <div key={p.title} className="flex items-center gap-2 py-2 border-b dark:border-white/4 border-black/4 last:border-0">
              <div className={`w-4 h-4 rounded-sm ${p.icon} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate">{p.title}</div>
                <div className="text-[9px] text-gray-400">{p.platform}</div>
              </div>
              <div className="text-[10px] font-bold text-primary">{p.reach}</div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-2xl border border-primary/25 bg-primary/4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold">AI Insight</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Video content is outperforming static posts by <strong className="text-primary">340%</strong>. Consider allocating 70% of your schedule to Reels this week.
          </p>
        </div>
      </div>
    </div>
  );
};

const AutopilotPanel = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
    <div className="lg:col-span-2 p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold">This Week — Content Calendar</span>
        <button className="text-[10px] text-primary font-bold">+ Add Post</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-[9px] text-gray-400 font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[
          { color: 'bg-pink-500',  label: 'IG',  time: '9am'  },
          { color: 'bg-black dark:bg-zinc-200',  label: 'TT',  time: '2pm'  },
          null,
          { color: 'bg-blue-600', label: 'LI',  time: '10am' },
          { color: 'bg-red-500',  label: 'YT',  time: '3pm'  },
          { color: 'bg-pink-500', label: 'IG',  time: '11am' },
          { color: 'bg-black dark:bg-zinc-200', label: 'TT',  time: '5pm'  },
        ].map((item, i) => (
          <div key={i} className={`rounded-lg p-1.5 min-h-12 flex flex-col items-center justify-center gap-0.5 ${item ? 'border border-black/6 dark:border-white/6 cursor-pointer hover:border-primary/40 transition-colors' : 'border border-dashed border-black/5 dark:border-white/5'}`}>
            {item && (
              <>
                <div className={`w-5 h-5 rounded-md ${item.color} flex items-center justify-center text-[8px] font-black text-white`}>{item.label}</div>
                <div className="text-[8px] text-gray-400">{item.time}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-3">
      <div className="p-4 rounded-2xl border dark:border-white/8 border-black/8 bg-white dark:bg-zinc-900">
        <div className="text-xs font-semibold mb-3">Connected platforms</div>
        {[
          { name: 'Instagram', status: 'Active', dot: 'bg-pink-500' },
          { name: 'TikTok',    status: 'Active', dot: 'bg-black dark:bg-white' },
          { name: 'LinkedIn',  status: 'Active', dot: 'bg-blue-600' },
          { name: 'YouTube',   status: 'Active', dot: 'bg-red-500' },
          { name: 'X (Twitter)', status: 'Connect', dot: 'bg-gray-400' },
        ].map((p) => (
          <div key={p.name} className="flex items-center justify-between py-2 border-b dark:border-white/4 border-black/4 last:border-0">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${p.dot}`} />
              <span className="text-xs">{p.name}</span>
            </div>
            <span className={`text-[10px] font-bold ${p.status === 'Active' ? 'text-emerald-500' : 'text-primary cursor-pointer'}`}>{p.status}</span>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-2xl border border-primary/25 bg-primary/4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold">Autopilot active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          AI has scheduled <strong className="text-[#0D0D0D] dark:text-white">14 posts</strong> for this week, optimized for peak engagement windows.
        </p>
      </div>
    </div>
  </div>
);

const PANEL_MAP: Record<string, React.ReactNode> = {
  'ai-content': <AIContentPanel />,
  'video':      <VideoPanel />,
  'analytics':  <AnalyticsPanel />,
  'autopilot':  <AutopilotPanel />,
};

export const ProductPreview = () => {
  const [activeTab, setActiveTab] = useState('ai-content');

  return (
    <section className="py-24 lg:py-36 relative overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/6 blur-[150px] rounded-full" />

      <div className="container px-4 mx-auto relative">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-primary/8 border border-primary/20 text-primary">
              <Zap className="w-3.5 h-3.5" />
              See it in action
            </div>
            <h2 className="mb-5 text-4xl font-extrabold md:text-6xl font-display leading-tight">
              The platform that{' '}
              <span className="text-gradient">does the work</span>{' '}
              for you.
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Explore every module — built to make you 10x more productive than your competitors.
            </p>
          </FadeIn>
        </div>

        {/* Tab nav */}
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg orange-glow-sm'
                    : 'border dark:border-white/8 border-black/8 hover:border-primary/30 hover:bg-primary/4'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Panel container */}
        <FadeIn delay={0.15}>
          <div className="relative rounded-3xl border dark:border-white/8 border-black/8 bg-gray-50 dark:bg-zinc-950/80 overflow-hidden shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/5 border-black/5 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-semibold text-gray-400">
                  Belsuite — {TABS.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
              <span className="text-xs text-gray-400 italic hidden sm:block">
                {TABS.find((t) => t.id === activeTab)?.tagline}
              </span>
            </div>

            {/* Active panel */}
            <div className="p-5 min-h-80">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  {PANEL_MAP[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>

        {/* Bottom CTA */}
        <FadeIn delay={0.25}>
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400 mb-4">Ready to experience the full platform?</p>
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold hover:brightness-110 transition-all orange-glow group">
              Start Your Free Trial
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
