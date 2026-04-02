'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Zap, TrendingUp } from 'lucide-react';

interface DemoConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoConversionModal = ({ isOpen, onClose }: DemoConversionModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <motion.div className="bg-white dark:bg-black border dark:border-white/10 border-black/5 rounded-3xl max-w-md w-full p-8 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4"
              >
                <TrendingUp className="w-6 h-6" />
              </motion.div>

              <h2 className="text-2xl font-bold font-display mb-2">
                Ready to scale your business?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join 1000+ creators, agencies, and brands who are already using Belsuite to automate their content and marketing.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">✓</div>
                  <span className="text-sm font-medium">14-day free trial, no credit card needed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">✓</div>
                  <span className="text-sm font-medium">Full access to all AI features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">✓</div>
                  <span className="text-sm font-medium">Cancel anytime, no questions asked</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg font-bold text-white bg-primary rounded-full hover:orange-glow transition-all">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="w-full mt-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                Continue Exploring
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
