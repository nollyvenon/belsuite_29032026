'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight, Play, Sparkles, Zap, BarChart3,
  Calendar, Video, Target, Search, Bell,
  TrendingUp, CheckCircle2, Users,
} from 'lucide-react';
import { FadeIn } from './FadeIn';

/* ── Dashboard Mockup ─────────────────────────────────── */
const DashboardMockup = () => {
  const stats = [
    { label: 'Total Reach', value: '2.4M', change: '+24%', color: 'text-emerald-500' },
    { label: 'AI Posts',    value: '1,247', change: '+18%', color: 'text-blue-500' },
    { label: 'Engagement',  value: '8.7%',  change: '+3.2%', color: 'text-purple-500' },
    { label: 'Revenue',     value: '$48.2K', change: '+31%', color: 'text-emerald-500' },
  ];

  const navItems = [
    { icon: <BarChart3 className="w-3 h-3" />, label: 'Dashboard', active: true },
    { icon: <Sparkles className="w-3 h-3" />,  label: 'AI Studio',  active: false },
    { icon: <Video className="w-3 h-3" />,      label: 'Videos',     active: false },
    { icon: <Calendar className="w-3 h-3" />,   label: 'Schedule',   active: false },
    { icon: <Target className="w-3 h-3" />,     label: 'Ads',        active: false },
    { icon: <BarChart3 className="w-3 h-3" />,  label: 'Analytics',  active: false },
  ];

  const chartBars = [40, 58, 45, 72, 50, 88, 65, 80, 55, 92, 70, 100];

  const recentPosts = [
    { platform: 'Instagram', dot: 'bg-pink-500',  title: 'Product launch reel',     status: 'Published', reach: '24.2K' },
    { platform: 'TikTok',    dot: 'bg-black dark:bg-zinc-200', title: 'Behind the scenes clip', status: 'Scheduled', reach: '18.7K' },
    { platform: 'YouTube',   dot: 'bg-red-500',   title: 'Tutorial \u2014 how we 10x results', status: 'Published', reach: '41.9K' },
    { platform: 'LinkedIn',  dot: 'bg-blue-600',  title: 'Industry insights thread', status: 'Draft',     reach: '—' },
  ];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-black/8 dark:border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-white dark:bg-zinc-950 text-[#0D0D0D] dark:text-white text-left">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-3 h-3 text-white fill-current" />
          </div>
          <span className="text-xs font-bold tracking-tight font-display">Belsuite</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">PRO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] text-gray-500">
            <Search className="w-2.5 h-2.5" />
            <span>Search anything...</span>
          </div>
          <div className="relative cursor-pointer">
            <Bell className="w-3.5 h-3.5 text-gray-500" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-[9px] font-bold text-white shadow">JD</div>
        </div>
      </div>

      <div className="flex">
        {/* ── Sidebar ── */}
        <div className="hidden sm:flex flex-col w-24 lg:w-28 border-r border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900 p-2 gap-0.5 shrink-0">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                item.active
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/3 dark:hover:bg-white/3'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5">
            <div className="px-2 py-1.5 text-[10px] text-gray-400">v2.4.1</div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 p-3 bg-gray-50/80 dark:bg-zinc-950 overflow-hidden min-w-0">

          {/* Page title */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold">AI Dashboard</h2>
              <p className="text-[10px] text-gray-400">Friday, Apr 10, 2026</p>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-semibold">
              <Sparkles className="w-2.5 h-2.5" />
              Generate
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm">
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">{stat.label}</div>
                <div className="text-sm font-bold font-display leading-tight">{stat.value}</div>
                <div className={`text-[10px] ${stat.color} font-semibold mt-0.5`}>{stat.change} ↑</div>
              </div>
            ))}
          </div>

          {/* Chart + AI Panel row */}
          <div className="grid grid-cols-5 gap-2 mb-2.5">
            {/* Bar chart */}
            <div className="col-span-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold">Content Performance</span>
                <span className="text-[9px] text-gray-400 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-full">Last 12 weeks</span>
              </div>
              <div className="flex items-end gap-0.5 h-12">
                {chartBars.map((h, i) => (
                  <motion.div
                    key={i}
                    style={{ height: `${h}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                    className={`flex-1 rounded-sm ${
                      i === chartBars.length - 1
                        ? 'bg-primary'
                        : i > 8
                        ? 'bg-primary/50'
                        : 'bg-primary/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>W1</span><span>W6</span><span>W12</span>
              </div>
            </div>

            {/* AI panel */}
            <div className="col-span-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-primary/25 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold">AI Studio</span>
                <span className="ml-auto flex items-center gap-0.5 text-[9px] text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-1 mb-2">
                {[100, 85, 65, 45].map((w, i) => (
                  <motion.div
                    key={i}
                    style={{ width: `${w}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.15 }}
                    className="h-1.5 rounded-full bg-primary/20"
                  />
                ))}
              </div>
              <div className="text-[9px] px-2 py-1 rounded-lg bg-primary text-white font-semibold text-center">
                ✓ Auto-posted to 5 platforms
              </div>
            </div>
          </div>

          {/* Recent posts */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold">Recent AI Content</span>
              <span className="text-[9px] text-primary cursor-pointer hover:underline">View all →</span>
            </div>
            <div className="space-y-1.5">
              {recentPosts.map((post) => (
                <div key={post.title} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-3 h-3 rounded-sm ${post.dot} flex-shrink-0`} />
                    <span className="text-gray-600 dark:text-gray-300 truncate">{post.title}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="hidden lg:block text-gray-400">{post.reach}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                      post.status === 'Published' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                      post.status === 'Scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>{post.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Hero ─────────────────────────────────────────────── */
export const Hero = () => {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden lg:pt-40 lg:pb-24 bg-grid">
      {/* Radial glow orbs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 blur-[140px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-40 left-[15%] w-[300px] h-[300px] bg-orange-300/10 blur-[80px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-60 right-[10%] w-[250px] h-[250px] bg-primary/10 blur-[80px] rounded-full -z-10" />

      <div className="container px-4 mx-auto">
        <div className="text-center">

          {/* Announcement badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-7 text-xs font-semibold border rounded-full bg-primary/5 border-primary/20 text-primary cursor-default select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              New — AI Ad Generator &amp; Campaign Autopilot is live
              <ArrowRight className="w-3 h-3" />
            </div>
          </FadeIn>

          {/* Main headline */}
          <FadeIn delay={0.08}>
            <h1 className="max-w-5xl mx-auto mb-6 text-[clamp(2.6rem,7vw,5.5rem)] font-extrabold tracking-tight leading-[1.05] font-display">
              The only AI platform<br />
              that <span className="text-gradient">creates, posts &amp; scales</span><br />
              your content for you.
            </h1>
          </FadeIn>

          {/* Subheadline */}
          <FadeIn delay={0.16}>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-gray-500 dark:text-gray-400 md:text-xl leading-relaxed">
              Generate viral videos, AI ads, and high-converting copy in seconds.
              Schedule to every platform. Automate everything.{' '}
              <strong className="text-[#0D0D0D] dark:text-white font-semibold">All in one tab.</strong>
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.22}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-full bg-primary orange-glow hover:brightness-110 transition-all group"
              >
                Start Free — No Card Needed
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <Link
                href="/demo"
                className="flex items-center gap-2.5 px-8 py-4 text-base font-bold rounded-full border dark:border-white/12 border-black/10 hover:bg-black/4 dark:hover:bg-white/4 transition-all group"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Play className="w-3.5 h-3.5 text-primary fill-primary ml-0.5" />
                </span>
                Watch 2-min Demo
              </Link>
            </div>

            {/* Trust micro-copy */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime</span>
            </div>

            {/* Live user count */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="flex -space-x-1.5">
                {['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-[#0D0D0D] ${c} flex items-center justify-center text-[9px] font-bold text-white`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span><strong className="text-[#0D0D0D] dark:text-white font-semibold">10,000+</strong> creators already scaling</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Dashboard mockup */}
        <FadeIn delay={0.36} className="mt-16 lg:mt-20">
          <div className="relative max-w-5xl mx-auto">
            {/* Glow behind dashboard */}
            <div className="absolute -inset-4 bg-primary/10 blur-[60px] rounded-3xl -z-10" />

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 top-12 z-20 hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 shadow-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-600">+247% Growth</div>
                <div className="text-[10px] text-gray-400">This month vs last</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute -right-4 top-8 z-20 hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 shadow-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold">47 posts generated</div>
                <div className="text-[10px] text-gray-400">Today by AI</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute -right-2 bottom-16 z-20 hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 shadow-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold">Auto-posted</div>
                <div className="text-[10px] text-gray-400">Instagram, TikTok &amp; 3 more</div>
              </div>
            </motion.div>

            <DashboardMockup />
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
