'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const navLinks = [
  { label: 'Features', href: '/#systems' },
  { label: 'Demo', href: '/demo' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Team', href: '/#team' },
  { label: 'Contact', href: '/contact' },
] as const;

export default function Navbar({ isDark, onToggleDark }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = `transition-colors font-medium ${
    isDark ? 'text-gray-300 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'
  }`;

  return (
    <nav
      className={`sticky top-0 z-50 border-b ${
        isDark ? 'border-orange-900/30 bg-black/95' : 'border-orange-100 bg-white/95'
      } backdrop-blur-xl`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold hidden sm:inline">Belsuite</span>
        </Link>

        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={onToggleDark}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-orange-900/30 hover:bg-orange-900/50' : 'bg-orange-50 hover:bg-orange-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <Link
            href="/login"
            className={`px-4 py-2 rounded-lg font-medium hidden sm:inline-block transition-colors ${
              isDark
                ? 'text-orange-400 hover:text-orange-300 border border-orange-700/50 hover:border-orange-600'
                : 'text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-400'
            }`}
          >
            Login
          </Link>

          <Link
            href="/register"
            className={`px-6 py-2 rounded-lg font-bold hidden sm:inline-block transition-all text-white shadow-lg ${
              isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            Start Free
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={24} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
            ) : (
              <Menu size={24} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={`border-t md:hidden ${
            isDark ? 'bg-black/90 border-orange-900/30' : 'bg-white/90 border-orange-100'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-orange-900/20' : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-orange-700/30 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'border border-orange-700/50 text-orange-400 hover:bg-orange-900/20'
                    : 'border border-orange-200 text-orange-600 hover:bg-orange-50'
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-center py-2 rounded-lg font-bold text-white transition-all ${
                  isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
