'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BadgeDollarSign,
  BarChart3,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Megaphone,
  Shield,
  Share2,
  Sparkles,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', href: '/analytics', Icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', href: '/marketing', Icon: Megaphone },
  { id: 'social', label: 'Social', href: '/social', Icon: Share2 },
  { id: 'video', label: 'Video', href: '/video', Icon: Video },
  { id: 'ugc', label: 'UGC', href: '/ugc', Icon: Wand2 },
  { id: 'billing', label: 'Billing', href: '/billing', Icon: BadgeDollarSign },
  { id: 'ai', label: 'AI', href: '/ai/dashboard', Icon: Sparkles },
  { id: 'admin', label: 'Admin', href: '/admin', Icon: Shield },
] as const;

function NavItems({ activeRoute, collapsed, onNavigate }: { activeRoute: string; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="space-y-2">
      {NAV_ITEMS.map(({ id, label, href, Icon }) => {
        const active = activeRoute === id;
        return (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center rounded-2xl px-3 py-3 text-sm transition-colors',
              active ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white',
              collapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{label}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ activeRoute, children }: { activeRoute: string; children: React.ReactNode }) {
  const { accessToken, hydrate, clearSession } = useAuthStore();
  const { sidebarCollapsed, mobileMenuOpen, toggleSidebar, setMobileMenuOpen } = useUIStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.14),_transparent_24%),linear-gradient(180deg,_#07111f_0%,_#09101b_44%,_#05070d_100%)] text-white">
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#050914]/95 p-5 lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">BelSuite Workspace</p>
                <p className="text-xs text-slate-500">Cross-platform control center</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavItems activeRoute={activeRoute} collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={cn('hidden shrink-0 border-r border-white/10 bg-black/20 p-4 backdrop-blur-xl lg:flex lg:flex-col', sidebarCollapsed ? 'w-[92px]' : 'w-[290px]')}>
          <div className={cn('mb-8 flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
            {!sidebarCollapsed ? (
              <div>
                <p className="text-sm font-semibold text-white">BelSuite Workspace</p>
                <p className="text-xs text-slate-500">Web, mobile, and desktop system</p>
              </div>
            ) : null}
            <button onClick={toggleSidebar} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white">
              <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed ? 'rotate-180' : '')} />
            </button>
          </div>

          <NavItems activeRoute={activeRoute} collapsed={sidebarCollapsed} />

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Session</p>
            <p className="mt-3 text-sm text-white">{accessToken ? 'Authenticated workspace' : 'Guest mode'}</p>
            <p className="mt-1 text-xs text-slate-400">{accessToken ? 'API-backed routes are ready.' : 'Sign in to unlock live data.'}</p>
            {accessToken ? (
              <button onClick={clearSession} className="mt-4 w-full rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                Clear session
              </button>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-white/10 p-2 text-slate-300 lg:hidden">
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-sm font-semibold text-white">Frontend System</p>
                  <p className="text-xs text-slate-500">Unified shell for web, mobile, and desktop</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}