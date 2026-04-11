'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Sun, Moon, Zap, Menu, X, ChevronDown } from 'lucide-react';
import { LoginModal } from './LoginModal';

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Content',      href: '/content' },
  { label: 'AI Roles',     href: '/ai/customer-support' },
  { label: 'Live Demo',    href: '/demo', highlight: true },
  { label: 'FAQ',          href: '/faq' },
  { label: 'Contact',      href: '/contact' },
];

export const Navbar = () => {
  const { isDark, toggle } = useDarkMode();
  const [isLoginOpen, setIsLoginOpen]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled]         = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const close = () => setIsMobileOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className={`flex items-center justify-between w-full max-w-5xl px-5 py-2.5 rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/8 dark:border-white/8 shadow-lg shadow-black/5'
              : 'bg-white/70 dark:bg-black/70 backdrop-blur-md border border-black/6 dark:border-white/6'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Belsuite home">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary group-hover:brightness-110 transition-all">
              <Zap className="w-4.5 h-4.5 text-white fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display">Belsuite</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                    link.highlight
                      ? 'text-primary font-bold hover:bg-primary/8'
                      : 'text-gray-600 dark:text-gray-400 hover:text-[#0D0D0D] dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/4'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                    link.highlight
                      ? 'text-primary font-bold hover:bg-primary/8'
                      : 'text-gray-600 dark:text-gray-400 hover:text-[#0D0D0D] dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/4'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Sign in
            </button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsLoginOpen(true)}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-primary hover:brightness-110 transition-all orange-glow-sm"
            >
              Start Free Trial
            </motion.button>
          </div>

          {/* Mobile: dark toggle + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 left-3 right-3 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-black/8 dark:border-white/8 shadow-2xl"
            >
              <div className="flex flex-col gap-1 mb-4">
                {NAV_LINKS.map((link) => (
                  link.href.startsWith('#') ? (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        link.highlight
                          ? 'text-primary font-bold bg-primary/5'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-black/4 dark:hover:bg-white/4'
                      }`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        link.highlight
                          ? 'text-primary font-bold bg-primary/5'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-black/4 dark:hover:bg-white/4'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => { setIsMobileOpen(false); setIsLoginOpen(true); }}
                  className="w-full py-3 text-sm font-semibold border rounded-xl border-black/10 dark:border-white/10 hover:bg-black/4 dark:hover:bg-white/4 transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setIsMobileOpen(false); setIsLoginOpen(true); }}
                  className="w-full py-3 text-sm font-bold text-white rounded-xl bg-primary hover:brightness-110 transition-all"
                >
                  Start Free Trial
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsLoginOpen(false);
        }}
      />
    </>
  );
};
