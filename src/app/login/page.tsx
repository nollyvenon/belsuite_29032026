'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const { setSession } = useAuthStore();
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const raw: unknown = await response.json();
      if (!response.ok) {
        const err = raw as { message?: string };
        throw new Error(err.message || 'Login failed');
      }
      const envelope = raw as { success?: boolean; data?: Record<string, string> };
      const data = envelope.success && envelope.data ? envelope.data : (raw as Record<string, string>);
      if (data?.accessToken && data?.refreshToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('token', data.accessToken);
        if (data.organizationId) {
          localStorage.setItem('organizationId', data.organizationId);
        }
        setSession(data.accessToken, data.refreshToken);
      }
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors duration-300 flex flex-col`}>
      {/* Simple Header */}
      <div className={`border-b ${isDark ? 'border-orange-900/30 bg-black/80' : 'border-orange-100 bg-white/80'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold hidden sm:inline">Belsuite</span>
          </Link>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className={`w-full max-w-md rounded-2xl border-2 p-8 ${isDark ? 'bg-black border-orange-700/50' : 'bg-white border-orange-200'}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Sign in to your Belsuite account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30 focus-within:border-orange-600' : 'bg-orange-50 border-orange-200 focus-within:border-orange-400'}`}>
                <Mail size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30 focus-within:border-orange-600' : 'bg-orange-50 border-orange-200 focus-within:border-orange-400'}`}>
                <Lock size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Remember me</span>
              </label>
              <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-white ${
                isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={20} />}
            </button>

            <div className="relative">
              <div className={`absolute inset-0 flex items-center ${isDark ? 'border-orange-700/30' : 'border-orange-200'}`}>
                <div className={`w-full border-t ${isDark ? 'border-orange-700/30' : 'border-orange-200'}`}></div>
              </div>
              <div className={`relative flex justify-center text-sm ${isDark ? 'bg-black' : 'bg-white'}`}>
                <span className={`px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>or continue with</span>
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-3 rounded-xl font-semibold transition-colors border-2 flex items-center justify-center gap-2 ${
                isDark
                  ? 'border-orange-700/30 text-gray-300 hover:bg-orange-900/20'
                  : 'border-orange-200 text-gray-700 hover:bg-orange-50'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Google
            </button>
          </form>

          <p className={`text-center mt-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-orange-600 hover:text-orange-700 font-bold">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
