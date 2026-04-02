'use client';

import React, { useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { Cpu, TrendingUp, AlertCircle, Download, Zap } from 'lucide-react';
import { MOCK_USAGE } from '@/lib/demo-data-expanded';
import { AnimatedCounter } from './AnimatedCounter';

const UsageCard = ({ label, value, max, icon: Icon, unit, costPerUnit }: any) => {
  const percentage = (value / max) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{label}</p>
          </div>
        </div>
        {costPerUnit && (
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ${costPerUnit}/{unit}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            <AnimatedCounter end={value} />
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">of {max.toLocaleString()} {unit}s</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={
              percentage >= 90 ? 'bg-red-500' :
              percentage >= 70 ? 'bg-orange-500' :
              'bg-emerald-500'
            }
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        {percentage.toFixed(1)}% used • {Math.round((max - value) / (costPerUnit || 1))} remaining
      </p>
    </motion.div>
  );
};

export const UsageViewEnhanced = () => {
  const totalCost = (
    MOCK_USAGE.videosGenerated * MOCK_USAGE.costPerVideo +
    MOCK_USAGE.imagesGenerated * MOCK_USAGE.costPerImage +
    MOCK_USAGE.postsGenerated * MOCK_USAGE.costPerPost +
    MOCK_USAGE.emailsGenerated * MOCK_USAGE.costPerEmail
  ).toFixed(2);

  const formatCost = (num: number) => (num * (MOCK_USAGE.tokensUsed / 100000)).toFixed(2);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white mb-2">
          AI Usage & Credits
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your token usage and AI content generation costs
        </p>
      </motion.div>

      {/* Main Usage Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 border rounded-2xl dark:border-white/10 border-black/5 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">Total Tokens</p>
            <p className="text-5xl font-bold font-display text-gray-900 dark:text-white">
              <AnimatedCounter end={MOCK_USAGE.tokensUsed} />
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              of {MOCK_USAGE.tokensLimit.toLocaleString()} limited tokens
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">This Month</p>
            <p className="text-4xl font-bold text-primary font-display">
              ${MOCK_USAGE.costEstimate}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              of ${MOCK_USAGE.monthlyBudget} budget
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-primary/20">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
              <p className="text-2xl font-bold font-display text-primary">
                {(MOCK_USAGE.tokensLimit - MOCK_USAGE.tokensUsed).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Usage Rate</p>
              <p className="text-2xl font-bold font-display">
                {MOCK_USAGE.percentUsed.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Est. Days Left</p>
              <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                {Math.round((MOCK_USAGE.tokensLimit - MOCK_USAGE.tokensUsed) / (MOCK_USAGE.tokensUsed / 30))}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Generation Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
          Content Generated This Month
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UsageCard
            label="Videos Generated"
            value={MOCK_USAGE.videosGenerated}
            max={100}
            icon={Zap}
            unit="video"
            costPerUnit={MOCK_USAGE.costPerVideo}
          />
          <UsageCard
            label="Images Generated"
            value={MOCK_USAGE.imagesGenerated}
            max={500}
            icon={Zap}
            unit="image"
            costPerUnit={MOCK_USAGE.costPerImage}
          />
          <UsageCard
            label="Posts Generated"
            value={MOCK_USAGE.postsGenerated}
            max={2000}
            icon={Zap}
            unit="post"
            costPerUnit={MOCK_USAGE.costPerPost}
          />
          <UsageCard
            label="Emails Generated"
            value={MOCK_USAGE.emailsGenerated}
            max={200}
            icon={Zap}
            unit="email"
            costPerUnit={MOCK_USAGE.costPerEmail}
          />
        </div>
      </motion.div>

      {/* Token Usage Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 border-l-4 border-l-orange-500 rounded-lg bg-orange-50 dark:bg-orange-950/20 border dark:border-white/10 border-black/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              📊 You're using {MOCK_USAGE.percentUsed.toFixed(1)}% of your monthly tokens
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              At this rate, you'll exceed your limit in {Math.round((MOCK_USAGE.tokensLimit - MOCK_USAGE.tokensUsed) / (MOCK_USAGE.tokensUsed / 30))} days. Consider upgrading to a higher tier to unlock more credits.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:orange-glow transition-all text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              Upgrade Plan
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          Cost Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { label: '🎬 Videos', count: MOCK_USAGE.videosGenerated, cost: MOCK_USAGE.costPerVideo },
            { label: '🖼️ Images', count: MOCK_USAGE.imagesGenerated, cost: MOCK_USAGE.costPerImage },
            { label: '📝 Posts', count: MOCK_USAGE.postsGenerated, cost: MOCK_USAGE.costPerPost },
            { label: '📧 Emails', count: MOCK_USAGE.emailsGenerated, cost: MOCK_USAGE.costPerEmail },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center justify-between p-3 border rounded-lg dark:border-white/5 border-black/5 bg-black/5 dark:bg-white/5"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.count} generated</p>
              </div>
              <p className="text-lg font-bold text-primary">
                ${(item.count * item.cost).toFixed(2)}
              </p>
            </motion.div>
          ))}
          <div className="border-t dark:border-white/10 border-black/5 pt-3 mt-3 flex items-center justify-between">
            <p className="font-bold text-gray-900 dark:text-white">Total This Month</p>
            <p className="text-2xl font-bold font-display text-primary">${totalCost}</p>
          </div>
        </div>
      </motion.div>

      {/* Export & Download */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full flex items-center justify-center gap-2 py-4 border rounded-xl dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold text-gray-900 dark:text-white"
      >
        <Download className="w-5 h-5" />
        Download Usage Report
      </motion.button>
    </div>
  );
};
