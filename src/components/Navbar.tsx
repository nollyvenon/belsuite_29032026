'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Sun, Moon, Zap, Video } from 'lucide-react';
import { LoginModal } from './LoginModal';

export const Navbar = () => {
  const { isDark, toggle } = useDarkMode();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between w-full max-w-5xl px-6 py-3 border rounded-full glass dark:border-white/10 border-black/5 bg-white/80 dark:bg-black/80 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter font-display">Belsuite</span>
          </div>

          <div className="hidden gap-8 md:flex">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">How it works</a>
            <a href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">Pricing</a>
            <a href="/demo" className="text-sm font-bold text-primary transition-colors hover:underline">Live Demo</a>
            <a href="/video" className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary">
              <Video className="w-3.5 h-3.5" /> Video Studio
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggle}
              className="p-2 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLoginOpen(true)}
              className="hidden px-5 py-2 text-sm font-semibold text-white transition-all rounded-full bg-primary hover:brightness-110 md:block"
            >
              Start Free Trial
            </motion.button>
          </div>
        </motion.div>
      </nav>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          // Handle successful login
          console.log('User logged in successfully');
        }}
      />
    </>
  );
};
