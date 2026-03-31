'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Apple } from 'lucide-react';

export interface OAuthButtonsProps {
  isLoading?: boolean;
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
  onFacebookClick?: () => void;
}

export const OAuthButtons = ({
  isLoading = false,
  onGoogleClick,
  onAppleClick,
  onFacebookClick,
}: OAuthButtonsProps) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Google OAuth Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGoogleClick}
        disabled={isLoading}
        className="flex items-center justify-center w-full gap-3 px-4 py-3 border transition-all rounded-lg border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21.8 12.23c0-.76-.07-1.49-.19-2.2H12v4.17h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.94-1.79 3.04-4.44 3.04-7.61Z" fill="#4285F4"/>
          <path d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.3-2.56c-.92.62-2.09.99-3.45.99-2.65 0-4.89-1.79-5.69-4.2H2.9v2.64A10 10 0 0 0 12 22Z" fill="#34A853"/>
          <path d="M6.31 13.77A6 6 0 0 1 6 12c0-.62.11-1.22.31-1.77V7.59H2.9A10 10 0 0 0 2 12c0 1.61.39 3.13 1.09 4.41l3.22-2.64Z" fill="#FBBC05"/>
          <path d="M12 6.03c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.98 14.74 2 12 2A10 10 0 0 0 2.9 7.59l3.41 2.64c.8-2.41 3.04-4.2 5.69-4.2Z" fill="#EA4335"/>
        </svg>
        <span className="text-sm font-medium">Continue with Google</span>
      </motion.button>

      {/* Apple OAuth Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAppleClick}
        disabled={isLoading}
        className="flex items-center justify-center w-full gap-3 px-4 py-3 border transition-all rounded-lg border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Apple className="w-5 h-5" />
        <span className="text-sm font-medium">Continue with Apple</span>
      </motion.button>

      {/* Facebook OAuth Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onFacebookClick}
        disabled={isLoading}
        className="flex items-center justify-center w-full gap-3 px-4 py-3 border transition-all rounded-lg border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="text-sm font-medium">Continue with Facebook</span>
      </motion.button>
    </div>
  );
};
