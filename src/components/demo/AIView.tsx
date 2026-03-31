'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';
import { useDemo } from './DemoContext';
import { AI_RESPONSES } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

export const AIView = () => {
  const { isGenerating, setIsGenerating, generatedContent, setGeneratedContent } = useDemo();
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedContent('');
    
    // Simulate AI typing
    setTimeout(() => {
      setIsGenerating(false);
      const response = prompt.toLowerCase().includes('ad') 
        ? AI_RESPONSES['generate ad'] 
        : AI_RESPONSES['optimize campaign'];
      setGeneratedContent(response);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-display mb-4">AI Content Generator</h2>
        <p className="text-gray-500">Generate high-converting ads, posts, and emails in seconds.</p>
      </div>

      <div className="p-6 border rounded-3xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 shadow-xl">
        <div className="relative mb-4">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate (e.g. 'Create a Facebook ad for my new SaaS product Belsuite')" 
            className="w-full h-32 p-4 text-lg border rounded-2xl dark:border-white/10 border-black/5 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="flex items-center gap-2 px-6 py-2 font-bold text-white rounded-xl bg-primary hover:orange-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['Facebook Ad', 'Instagram Post', 'Email Sequence', 'Twitter Thread'].map((tag) => (
            <button 
              key={tag}
              onClick={() => setPrompt(`Generate a ${tag} for Belsuite`)}
              className="px-3 py-1 text-xs font-medium border rounded-full dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {(isGenerating || generatedContent) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 border rounded-3xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold font-display">AI Generated Content</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-5/6 animate-pulse" />
                </div>
              ) : (
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {generatedContent}
                </div>
              )}
            </div>

            {!isGenerating && (
              <div className="mt-8 pt-6 border-t dark:border-white/5 border-black/5 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Generated in 1.2s • Model: Belsuite-Pro-v2
                </div>
                <button className="text-sm font-bold text-primary hover:underline">
                  Save to Campaigns
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
