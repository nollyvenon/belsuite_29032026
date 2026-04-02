'use client';

import React, { useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Brain, Target, Award, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ENHANCED_MOCK_CHART_DATA, MOCK_ANALYTICS } from '@/lib/demo-data-expanded';
import { cn } from '@/lib/utils';

const InsightCard = ({ icon: Icon, title, insight, index }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-all"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">{title}</p>
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{insight}</p>
      </div>
    </div>
  </motion.div>
);

const MetricBox = ({ label, value, trend, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{label}</p>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-1">{value}</p>
    <p className="text-xs text-green-600 dark:text-green-400 font-medium">{trend}</p>
  </motion.div>
);

const CHANNEL_DATA = [
  { name: 'LinkedIn', value: 340, fill: '#0A66C2' },
  { name: 'Email', value: 280, fill: '#FF6A00' },
  { name: 'Facebook', value: 210, fill: '#1877F2' },
  { name: 'Instagram', value: 180, fill: '#E4405F' },
  { name: 'TikTok', value: 120, fill: '#000000' },
];

export const AnalyticsViewEnhanced = () => {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white mb-2">
          Performance Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time metrics and AI-powered insights about your campaigns
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricBox 
          label="Overall Engagement" 
          value="8.7%" 
          trend={`↑ ${MOCK_ANALYTICS.engagement.change} from last month`}
          icon={TrendingUp}
        />
        <MetricBox 
          label="Current Month ROI" 
          value={`${MOCK_ANALYTICS.roi.currentMonth}x`} 
          trend="Strong performance indicators"
          icon={Target}
        />
        <MetricBox 
          label="Top Channel" 
          value={MOCK_ANALYTICS.topChannel.name} 
          trend={`+${MOCK_ANALYTICS.topChannel.growth}% growth`}
          icon={Award}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Lead Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold font-display mb-4 text-gray-900 dark:text-white">
            Weekly Performance Trends
          </h3>
          <div className="h-[300px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ENHANCED_MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="name" stroke="#88888888" />
                  <YAxis stroke="#88888888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                  <Bar dataKey="leads" fill="#FF6A00" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </motion.div>

        {/* Channel Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold font-display mb-4 text-gray-900 dark:text-white">
            Channel Distribution
          </h3>
          <div className="h-[300px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CHANNEL_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {CHANNEL_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {CHANNEL_DATA.map(channel => (
              <div key={channel.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.fill }} />
                  <span className="text-gray-600 dark:text-gray-400">{channel.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{channel.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white">
            AI-Powered Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_ANALYTICS.insights.slice(0, 6).map((insight, index) => (
            <InsightCard
              key={index}
              icon={index % 3 === 0 ? TrendingUp : index % 3 === 1 ? Target : Brain}
              title={`Insight ${index + 1}`}
              insight={insight}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Recommendations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 border-l-4 border-l-orange-500 rounded-lg bg-orange-50 dark:bg-orange-950/20 border dark:border-white/10 border-black/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              🚀 Quick Wins to Boost Performance
            </h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Schedule email campaigns for 9-11am EST for max conversion</li>
              <li>✓ Increase LinkedIn ads budget by 20% (ROI is 40% above avg)</li>
              <li>✓ Add social proof elements to product pages (+34% conversion)</li>
              <li>✓ Create more video content (5.2x engagement vs static)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
