'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, Sparkles } from 'lucide-react';

export default function AIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-bold text-white">BelSuite AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-300 hover:text-white transition">
            Home
          </Link>
          <Link href="/ai/generate" className="text-gray-300 hover:text-white transition">
            Generate
          </Link>
          <Link href="/ai/dashboard" className="text-gray-300 hover:text-white transition">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              AI-Powered Content Generation
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Create high-quality content instantly with our advanced AI infrastructure.
              Smart routing, cost optimization, and real-time analytics.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Zap,
                title: 'Multiple Providers',
                description: 'Access OpenAI, Claude, and local models with smart routing.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Track tokens, costs, and usage across all your generations.',
              },
              {
                icon: Sparkles,
                title: '7+ Content Types',
                description: 'Generate blogs, social posts, ads, emails, and more.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition"
              >
                <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/ai/generate">
              <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition transform hover:scale-105">
                Start Generating
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/ai/dashboard">
              <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition transform hover:scale-105">
                View Analytics
                <BarChart3 className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-16 border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose BelSuite AI?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Smart Provider Routing',
                description:
                  'Automatically select the best AI provider based on cost, speed, and quality requirements. Optimize for your use case.',
              },
              {
                title: 'Cost Optimization',
                description:
                  'Intelligent caching and routing reduces costs. Track every penny spent on AI generation with detailed analytics.',
              },
              {
                title: 'Multi-Provider Support',
                description:
                  'Choose from OpenAI, Claude, local models, and more. Never be locked into a single provider.',
              },
              {
                title: 'Real-time Analytics',
                description:
                  'Monitor token usage, costs, cache performance, and provider efficiency in real-time dashboards.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Limits Section */}
      <section className="relative px-6 py-16 border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Plan Limits
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                tier: 'Free',
                requests: '10/min',
                tokens: '100K/month',
                color: 'from-gray-600 to-gray-500',
              },
              {
                tier: 'Starter',
                requests: '50/min',
                tokens: '1M/month',
                color: 'from-blue-600 to-blue-500',
              },
              {
                tier: 'Professional',
                requests: '200/min',
                tokens: '10M/month',
                color: 'from-purple-600 to-purple-500',
              },
              {
                tier: 'Enterprise',
                requests: '1000/min',
                tokens: '100M/month',
                color: 'from-orange-600 to-orange-500',
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`bg-gradient-to-br ${plan.color} p-6 rounded-lg text-white`}
              >
                <h3 className="text-lg font-bold mb-4">{plan.tier}</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Requests/min:</strong> {plan.requests}
                  </p>
                  <p className="text-sm">
                    <strong>Tokens/month:</strong> {plan.tokens}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
