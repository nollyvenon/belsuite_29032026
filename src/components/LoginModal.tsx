'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { OAuthButtons } from './OAuthButtons';
import { apiFetch } from '@/lib/api';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (token: string) => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSignUp
            ? { email, password, firstName: firstName || 'User', lastName: lastName || 'Account' }
            : { email, password },
        ),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setSession(data.accessToken, data.refreshToken);

      onLoginSuccess?.(data.accessToken);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail || email }),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to request password reset');
      }
      setError('If the email exists, reset instructions have been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/auth/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, redirectUri: `${window.location.origin}/oauth-callback` }),
      });
      const data = await response.json();
      if (!data?.url) {
        throw new Error('OAuth initialization failed');
      }
      window.location.href = data.url;
    } catch {
      setError('OAuth initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md p-6 rounded-2xl bg-white dark:bg-black border border-black/10 dark:border-white/10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-black/60 dark:text-white/60">
                {isSignUp
                  ? 'Sign up to get started with Belsuite'
                  : 'Sign in to your account to continue'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              >
                {error}
              </motion.div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 font-semibold text-white transition-all rounded-lg bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </motion.button>
            </form>
            {!isSignUp && (
              <div className="mb-5 rounded-lg border border-black/10 dark:border-white/10 p-3">
                <label className="block text-xs mb-2 text-black/60 dark:text-white/60">Forgot password email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={email || 'you@example.com'}
                    className="flex-1 px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              <span className="text-sm text-black/60 dark:text-white/60">or</span>
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            </div>

            {/* OAuth Buttons */}
            <OAuthButtons
              isLoading={isLoading}
              onGoogleClick={() => handleOAuthClick('google')}
              onAppleClick={() => handleOAuthClick('apple')}
              onFacebookClick={() => handleOAuthClick('facebook')}
            />

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-6 text-center text-sm">
              <span className="text-black/60 dark:text-white/60">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="ml-2 font-medium text-primary hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
