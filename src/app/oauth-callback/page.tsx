'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const provider = sessionStorage.getItem('oauth_provider') || 'unknown';

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        // Exchange code for tokens
        const response = await fetch(`/api/auth/oauth/${provider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await response.json();

        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Clear OAuth session
        sessionStorage.removeItem('oauth_provider');

        setStatus('success');
        setMessage(data.isNewUser ? 'Account created successfully!' : 'Welcome back!');

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Redirecting...');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-black to-black/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-white text-lg">{message}</p>
            <p className="text-white/60 text-sm mt-2">This may take a few moments...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              animate={{ scale: [0, 1], rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p className="text-white text-lg font-semibold">{message}</p>
            <p className="text-white/60 text-sm mt-2">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              animate={{ scale: [0, 1], rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full mx-auto mb-4 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <p className="text-white text-lg font-semibold">{message}</p>
            <p className="text-white/60 text-sm mt-2">Redirecting home...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
