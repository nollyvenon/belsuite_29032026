'use client';

import { FadeIn } from './FadeIn';
import { Star, Quote } from 'lucide-react';

/* ── Brand logos ── */
const LOGOS = [
  'Shopify', 'Stripe', 'Notion', 'HubSpot', 'Salesforce',
  'Google', 'Meta', 'TikTok', 'Canva', 'Mailchimp',
  'Webflow', 'Figma', 'Twilio', 'Zapier', 'Klaviyo',
];

/* ── Stats ── */
const STATS = [
  { value: '2M+',    label: 'Posts Generated',  sub: 'across all platforms' },
  { value: '10,000+', label: 'Active Creators',  sub: 'and growing fast' },
  { value: '340%',   label: 'Avg. Reach Boost', sub: 'vs manual posting' },
  { value: '99.9%',  label: 'Uptime SLA',       sub: 'enterprise-grade' },
];

/* ── Testimonials ── */
const TESTIMONIALS = [
  {
    quote: "Belsuite cut our content production time by 80%. We went from 3 posts a week to 3 posts a day — with better quality. Our Instagram alone grew 240% in 90 days.",
    name: "Sarah Chen",
    role: "Head of Marketing, TechScale",
    initials: "SC",
    color: "bg-purple-500",
    stars: 5,
  },
  {
    quote: "I replaced 7 tools — Buffer, Canva, Jasper, AdCreative, and more — with just Belsuite. Saved $1,400/month and my content has never performed better.",
    name: "Marcus Williams",
    role: "Founder, GrowthBrand Agency",
    initials: "MW",
    color: "bg-blue-600",
    stars: 5,
  },
  {
    quote: "Our ROAS went from 2.1x to 6.8x in 60 days using the AI Ad Engine. The creative testing alone is worth the entire subscription cost 10x over.",
    name: "Priya Kapoor",
    role: "E-commerce Director, LuxeGoods",
    initials: "PK",
    color: "bg-primary",
    stars: 5,
  },
];

/* ── Logo Marquee ── */
const LogoMarquee = () => {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <div className="relative overflow-hidden py-2 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-24 before:bg-gradient-to-r before:from-white dark:before:from-[#0D0D0D] before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-24 after:bg-gradient-to-l after:from-white dark:after:from-[#0D0D0D] after:to-transparent after:z-10">
      <div className="flex gap-12 animate-marquee whitespace-nowrap">
        {doubled.map((logo, i) => (
          <span
            key={i}
            className="inline-flex items-center text-xl font-bold tracking-tighter font-display text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-default select-none flex-shrink-0"
          >
            {logo}
          </span>
        ))}
      </div>
    </div>
  );
};

export const SocialProof = () => {
  return (
    <section className="py-16 lg:py-24 border-y dark:border-white/5 border-black/5 overflow-hidden">
      <div className="container px-4 mx-auto">

        {/* Trusted by label */}
        <FadeIn>
          <p className="mb-8 text-xs font-bold tracking-[0.2em] uppercase text-center text-gray-400">
            Trusted by 10,000+ creators, agencies &amp; brands worldwide
          </p>
        </FadeIn>

        {/* Logo marquee */}
        <LogoMarquee />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mt-16 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 text-center rounded-2xl border dark:border-white/5 border-black/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm hover:border-primary/30 transition-colors group">
                <div className="mb-1 text-3xl md:text-4xl font-extrabold font-display text-gradient group-hover:scale-105 inline-block transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-[#0D0D0D] dark:text-white">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-6 mt-16 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="relative h-full p-8 rounded-3xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60 hover:border-primary/30 transition-all hover:shadow-lg group">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
