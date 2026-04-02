'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Copy, RefreshCw, Check, Send, Loader } from 'lucide-react';
import { MOCK_AI_OUTPUTS } from '@/lib/demo-data-expanded';
import { useDemo } from './DemoContext';

interface ContentType {
  label: string;
  key: keyof typeof MOCK_AI_OUTPUTS;
  icon: React.ReactNode;
  placeholder: string;
}

const CONTENT_TYPES: ContentType[] = [
  { 
    label: 'Social Post', 
    key: 'social', 
    icon: <span>📱</span>, 
    placeholder: 'E.g., "Create a post about AI marketing"' 
  },
  { 
    label: 'Email Campaign', 
    key: 'email', 
    icon: <span>📧</span>, 
    placeholder: 'E.g., "Write a welcome email series"' 
  },
  { 
    label: 'Ad Copy', 
    key: 'ad', 
    icon: <span>📢</span>, 
    placeholder: 'E.g., "Create ad copy for SaaS"' 
  },
  { 
    label: 'LinkedIn Post', 
    key: 'linkedin', 
    icon: <span>💼</span>, 
    placeholder: 'E.g., "Professional thought leadership"' 
  },
];

const TypingAnimation = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [index, text]);

  return (
    <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
      {displayText}
      {index < text.length && <span className="animate-pulse">|</span>}
    </div>
  );
};

export const AIViewEnhanced = () => {
  const { isGenerating, setIsGenerating, generatedContent, setGeneratedContent } = useDemo();
  const [selectedType, setSelectedType] = useState<keyof typeof MOCK_AI_OUTPUTS>('social');
  const [prompt, setPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    setIsFinished(false);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const output = MOCK_AI_OUTPUTS[selectedType];
    setGeneratedContent(output);
    setIsGenerating(false);
    setIsFinished(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUse = () => {
    // Simulate using the content
    setPrompt('');
    setGeneratedContent('');
    setIsFinished(false);
  };

  const currentType = CONTENT_TYPES.find(t => t.key === selectedType);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 animate-pulse" />
          AI-Powered Content Generation
        </div>
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
          Generate Unlimited Content
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Type what you want to create. AI does the rest in seconds.
        </p>
      </motion.div>

      {/* Content Type Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {CONTENT_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-center group",
              selectedType === type.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 dark:border-white/10 hover:border-primary/50 text-gray-600 dark:text-gray-400"
            )}
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{type.icon}</div>
            <div className="text-xs font-semibold">{type.label}</div>
          </button>
        ))}
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            What would you like to create?
          </label>
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder={currentType?.placeholder}
              disabled={isGenerating}
              className="w-full px-4 py-3 border rounded-xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:orange-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Content
            </>
          )}
        </button>
      </motion.div>

      {/* Generated Content */}
      <AnimatePresence>
        {(generatedContent || isGenerating) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Content Card */}
            <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm min-h-[200px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[200px] gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-primary"
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    AI is creating your content...
                  </p>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                    className="h-1 bg-primary/20 rounded-full w-full max-w-xs overflow-hidden"
                  >
                    <motion.div
                      animate={{ x: ['0', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-full bg-primary"
                    />
                  </motion.div>
                </div>
              ) : (
                <TypingAnimation text={generatedContent} />
              )}
            </div>

            {/* Action Buttons */}
            {isFinished && !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 px-4 py-3 border rounded-xl dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-semibold"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>

                {/* Use Button */}
                <button
                  onClick={handleUse}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:orange-glow transition-all font-semibold"
                >
                  <Send className="w-5 h-5" />
                  Use This
                </button>
              </motion.div>
            )}

            {/* Generate More */}
            {isFinished && !isGenerating && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  setGeneratedContent('');
                  setIsFinished(false);
                  setPrompt('');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-xl dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-semibold text-gray-900 dark:text-white"
              >
                <RefreshCw className="w-5 h-5" />
                Generate More
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-primary/5 border-primary/20"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          💡 Quick Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>• Be specific: "React hooks tutorial for beginners" works better than "tutorial"</li>
          <li>• Include tone: "professional", "casual", "funny", "urgent" changes output</li>
          <li>• Add constraints: "under 280 chars" or "with emojis" for better results</li>
          <li>• Regenerate: Try different prompts to get variety</li>
        </ul>
      </motion.div>
    </div>
  );
};

// Helper for classname
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
