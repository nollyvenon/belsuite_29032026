'use client';

import { FadeIn } from './FadeIn';
import { Shield, Lock, Server, Globe, CheckCircle2 } from 'lucide-react';

const INTEGRATIONS = [
  { name: 'Meta',      color: 'bg-blue-600',    initial: 'M',  label: 'Facebook & Instagram' },
  { name: 'Google',    color: 'bg-red-500',     initial: 'G',  label: 'Ads & Analytics' },
  { name: 'TikTok',   color: 'bg-black dark:bg-zinc-200',   initial: 'T',  label: 'TikTok for Business' },
  { name: 'YouTube',  color: 'bg-red-600',     initial: 'YT', label: 'YouTube Studio' },
  { name: 'LinkedIn', color: 'bg-blue-700',    initial: 'In', label: 'LinkedIn Pages' },
  { name: 'Shopify',  color: 'bg-green-600',   initial: 'S',  label: 'Commerce & Products' },
  { name: 'HubSpot',  color: 'bg-orange-500',  initial: 'H',  label: 'CRM & Contacts' },
  { name: 'Zapier',   color: 'bg-orange-600',  initial: 'Z',  label: '6,000+ Automations' },
  { name: 'Stripe',   color: 'bg-indigo-600',  initial: 'St', label: 'Payments & Billing' },
  { name: 'Slack',    color: 'bg-purple-500',  initial: 'Sl', label: 'Team Notifications' },
  { name: 'Notion',   color: 'bg-gray-800 dark:bg-gray-200', initial: 'N',  label: 'Workspace Sync' },
  { name: 'Klaviyo',  color: 'bg-emerald-600', initial: 'K',  label: 'Email Marketing' },
];

const SECURITY = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: '256-bit Encryption',
    desc: 'All data encrypted in transit and at rest using AES-256.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'SOC 2 Type II',
    desc: 'Independently audited security, availability, and confidentiality.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'GDPR & CCPA',
    desc: 'Full compliance with global data privacy regulations.',
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: '99.9% Uptime SLA',
    desc: 'Enterprise-grade infrastructure with multi-region redundancy.',
  },
];

export const TrustSecurity = () => {
  return (
    <section className="py-24 lg:py-32 border-t dark:border-white/5 border-black/5 overflow-hidden relative">
      <div className="pointer-events-none absolute top-0 left-0 w-[400px] h-[400px] bg-primary/4 blur-[150px] rounded-full" />

      <div className="container px-4 mx-auto relative">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              Enterprise-grade trust
            </div>
            <h2 className="mb-5 text-4xl font-extrabold md:text-5xl font-display leading-tight">
              Built for scale.{' '}
              <span className="text-gradient">Secure by design.</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Whether you&apos;re a solo creator or a Fortune 500 team, your data is in safe hands.
            </p>
          </FadeIn>
        </div>

        {/* Security badges */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-20">
          {SECURITY.map((item, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 rounded-2xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/30 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Integration header */}
        <FadeIn>
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Connects with your entire stack
            </p>
            <h3 className="text-2xl md:text-3xl font-bold font-display">
              50+ integrations. Zero friction.
            </h3>
          </div>
        </FadeIn>

        {/* Integration grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {INTEGRATIONS.map((int, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="p-4 rounded-2xl border dark:border-white/6 border-black/6 bg-white dark:bg-zinc-900/60 hover:border-primary/30 hover:shadow-md transition-all group cursor-default flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl ${int.color} flex items-center justify-center text-xs font-black text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {int.initial}
                </div>
                <div>
                  <div className="text-xs font-bold">{int.name}</div>
                  <div className="text-[9px] text-gray-400 leading-tight mt-0.5">{int.label}</div>
                </div>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={INTEGRATIONS.length * 0.04}>
            <div className="p-4 rounded-2xl border border-dashed dark:border-white/10 border-black/10 flex flex-col items-center justify-center gap-2 text-center cursor-default">
              <div className="text-2xl font-extrabold font-display text-primary">+38</div>
              <div className="text-[10px] text-gray-400">More integrations</div>
            </div>
          </FadeIn>
        </div>

        {/* Bottom trust strip */}
        <FadeIn delay={0.3}>
          <div className="mt-14 p-6 rounded-2xl bg-black/3 dark:bg-white/3 border dark:border-white/4 border-black/4 flex flex-wrap items-center justify-center gap-8 text-xs text-gray-500">
            {[
              'No long-term contracts',
              'Cancel anytime',
              '14-day free trial',
              '24/7 live support',
              'SOC 2 certified',
              'GDPR compliant',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
