'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { OAuthButtons } from './OAuthButtons';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (token: string) => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      onLoginSuccess?.(data.accessToken);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);

    try {
      // Initialize OAuth flow based on provider
      const clientId = process.env[`NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID`];
      const redirectUri = `${window.location.origin}/oauth-callback`;

      let authUrl = '';

      switch (provider) {
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
          break;
        case 'apple':
          authUrl = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email&response_mode=form_post`;
          break;
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=email,public_profile`;
          break;
      }

      window.location.href = authUrl;
    } catch (err) {
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
