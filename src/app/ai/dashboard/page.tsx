'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, BarChart3 } from 'lucide-react';
import AIDashboard from '@/components/AIDashboard';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('30d');

  const timeRanges: Array<'24h' | '7d' | '30d'> = ['24h', '7d', '30d'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
        <Link href="/ai" className="flex items-center gap-2 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5 text-purple-400" />
          <span className="text-gray-300">Back to AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-bold text-white">Analytics Dashboard</span>
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
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">AI Usage Analytics</h1>
            <p className="text-gray-300">
              Monitor your AI generation usage, costs, and performance metrics in real-time.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AIDashboard timeRange={timeRange} />
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              title: 'Smart Routing',
              description:
                'We automatically route your requests to the most cost-effective provider that meets your quality requirements.',
            },
            {
              title: 'Intelligent Caching',
              description:
                'Identical requests are cached for 24 hours, reducing costs and improving response times.',
            },
            {
              title: 'Cost Optimization',
              description:
                'Choose between models based on your needs: fastest, cheapest, or best quality.',
            },
          ].map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/30 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{info.title}</h3>
              <p className="text-gray-300">{info.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Generate Content?</h2>
          <p className="text-gray-100 mb-6">
            Start creating high-quality content with our AI-powered tools. Multi-provider support, smart routing, and
            real-time analytics included.
          </p>
          <Link href="/ai/generate">
            <button className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105">
              Go to Generator
            </button>
          </Link>
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
