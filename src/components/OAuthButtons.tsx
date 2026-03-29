'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Chrome, Apple } from 'lucide-react';

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
        <Chrome className="w-5 h-5" />
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
