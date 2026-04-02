'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, BookOpen, Zap, Users, Settings, ChevronRight } from 'lucide-react';

const WALKTHROUGHS = [
  {
    id: 'getting-started',
    title: 'Getting Started with Belsuite',
    duration: '5:42',
    description: 'Complete setup walkthrough for new users',
    thumbnail: '🚀',
    topics: ['Account Setup', 'First Campaign', 'Dashboard Overview'],
    level: 'Beginner',
  },
  {
    id: 'ai-content-gen',
    title: 'AI Content Generation Mastery',
    duration: '8:15',
    description: 'Advanced techniques for creating viral content with AI',
    thumbnail: '✨',
    topics: ['Prompt Engineering', 'Content Types', 'Batch Generation', 'Optimization'],
    level: 'Intermediate',
  },
  {
    id: 'automation-builder',
    title: 'Building Your First Automation',
    duration: '6:30',
    description: 'Step-by-step guide to automating your workflows',
    thumbnail: '⚡',
    topics: ['Triggers & Actions', 'Conditionals', 'Testing', 'Deployment'],
    level: 'Beginner',
  },
  {
    id: 'analytics-deep-dive',
    title: 'Analytics & ROI Tracking Deep Dive',
    duration: '10:22',
    description: 'Understand your metrics and optimize for revenue',
    thumbnail: '📊',
    topics: ['Dashboard Metrics', 'Custom Reports', 'Goal Tracking', 'Attribution'],
    level: 'Advanced',
  },
  {
    id: 'integrations',
    title: 'Connecting Your Tools (Slack, Webhooks, Zapier)',
    duration: '7:45',
    description: 'Integrate with your favorite marketing tools',
    thumbnail: '🔗',
    topics: ['Slack Integration', 'Webhooks', 'Zapier', 'Troubleshooting'],
    level: 'Intermediate',
  },
  {
    id: 'multi-channel',
    title: 'Multi-Channel Campaign Strategy',
    duration: '12:08',
    description: 'Manage campaigns across email, social, ads, and more',
    thumbnail: '📱',
    topics: ['Channel Strategy', 'Scheduling', 'A/B Testing', 'Performance Tracking'],
    level: 'Advanced',
  },
];

const QUICK_GUIDES = [
  '📖 AI Prompt Best Practices',
  '💡 Content Calendar Template',
  '📊 Analytics Cheat Sheet',
  '⚙️ Automation Examples',
  '🎯 Conversion Rate Optimization',
  '🚀 Growth Hacking Tactics',
];

export function VideoWalkthroughs() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const filteredVideos = selectedLevel === 'All'
    ? WALKTHROUGHS
    : WALKTHROUGHS.filter(w => w.level === selectedLevel);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10 p-8 border border-blue-200/50 dark:border-blue-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎬</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Video Walkthroughs & Guides
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Master Belsuite with our comprehensive video tutorials and quick guides. Learn at your own pace with step-by-step instructions.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              selectedLevel === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVideos.map((video, index) => (
          <motion.button
            key={video.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedVideo(video.id)}
            className="text-left rounded-2xl overflow-hidden bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
          >
            {/* Thumbnail */}
            <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center overflow-hidden">
              <div className="text-6xl group-hover:scale-110 transition-transform">
                {video.thumbnail}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {video.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {video.description}
                </p>
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-1">
                {video.topics.slice(0, 2).map((topic) => (
                  <span
                    key={topic}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                  >
                    {topic}
                  </span>
                ))}
                {video.topics.length > 2 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{video.topics.length - 2} more
                  </span>
                )}
              </div>

              {/* Level Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  video.level === 'Beginner'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : video.level === 'Intermediate'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                }`}>
                  {video.level}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick Guides Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Quick Reference Guides
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_GUIDES.map((guide) => (
            <motion.button
              key={guide}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {guide}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-500/20 p-6"
      >
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Get Personal Help
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Our support team is here to help you get the most out of Belsuite. Get personalized guidance and 1-on-1 onboarding sessions.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
              <Zap className="w-4 h-4" />
              Schedule a Demo
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal for Selected Video */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedVideo(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            {/* Video Player Placeholder */}
            <div className="bg-black aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {WALKTHROUGHS.find(v => v.id === selectedVideo)?.thumbnail}
                </div>
                <p className="text-white font-bold mb-4">
                  {WALKTHROUGHS.find(v => v.id === selectedVideo)?.title}
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                  <Play className="w-5 h-5" />
                  Play Video
                </button>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {WALKTHROUGHS.find(v => v.id === selectedVideo)?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {WALKTHROUGHS.find(v => v.id === selectedVideo)?.description}
              </p>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
