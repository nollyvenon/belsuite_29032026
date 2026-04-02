'use client';

import { motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface DemoConversionBarProps {
  isVisible: boolean;
}

export const DemoConversionBar = ({ isVisible }: DemoConversionBarProps) => {
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed || !isVisible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t dark:border-white/10 border-black/5 bg-white/95 dark:bg-black/95 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold font-display text-sm md:text-base">
            Impressed with what you've seen?
          </h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Start your free trial and unlock full access to all AI features
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsClosed(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button className="flex items-center gap-2 px-6 py-2 text-white bg-primary rounded-full hover:orange-glow transition-all text-sm font-bold whitespace-nowrap">
            Try Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
