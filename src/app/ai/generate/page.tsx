'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AIContentGenerator from '@/components/AIContentGenerator';

export default function GeneratePage() {
  const [selectedType, setSelectedType] = useState<string>('blog_post');

  const contentTypes = [
    { id: 'blog_post', label: 'Blog Post', description: 'Long-form SEO-optimized articles' },
    { id: 'social_post', label: 'Social Media', description: 'Platform-specific posts' },
    { id: 'ad_copy', label: 'Ad Copy', description: 'High-converting advertisements' },
    { id: 'email_campaign', label: 'Email Campaign', description: 'Marketing emails' },
    { id: 'product_description', label: 'Product Description', description: 'E-commerce listings' },
    { id: 'video_script', label: 'Video Script', description: 'Structured video content' },
    { id: 'headlines', label: 'Headlines', description: 'Multiple title options' },
    { id: 'image', label: 'Image Generation', description: 'DALL-E powered images' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
        <Link href="/ai" className="flex items-center gap-2 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5 text-purple-400" />
          <span className="text-gray-300">Back to AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-bold text-white">Content Generator</span>
        </div>
        <div className="w-24"></div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Content Generator</h1>
          <p className="text-gray-300">
            Select a content type below and let our AI generate high-quality content for your needs.
          </p>
        </motion.div>

        {/* Content Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Choose Content Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
                  selectedType === type.id
                    ? 'border-purple-500 bg-gradient-to-br from-purple-600/20 to-purple-400/10'
                    : 'border-purple-500/30 bg-gray-900/50 hover:border-purple-500/60'
                }`}
              >
                <h3 className="font-semibold text-white text-left">{type.label}</h3>
                <p className="text-sm text-gray-400 text-left mt-2">{type.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Generator Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-8"
        >
          <AIContentGenerator contentType={selectedType} />
        </motion.div>
      </div>

      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
}
