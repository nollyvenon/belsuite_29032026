'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Activity, Zap, Globe, ArrowUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const LIVE_DATA = [
  { time: '00:00', signups: 24, revenue: 4200, trials: 12 },
  { time: '04:00', signups: 42, revenue: 6800, trials: 18 },
  { time: '08:00', signups: 89, revenue: 12400, trials: 35 },
  { time: '12:00', signups: 156, revenue: 22100, trials: 62 },
  { time: '16:00', signups: 203, revenue: 31200, trials: 89 },
  { time: '20:00', signups: 267, revenue: 42800, trials: 126 },
  { time: '24:00', signups: 312, revenue: 54200, trials: 156 },
];

const CUSTOMER_SEGMENTS = [
  { name: 'Solopreneurs', users: 2341, trend: '+18%', icon: '👤' },
  { name: 'Agencies', users: 1205, trend: '+42%', icon: '🏢' },
  { name: 'Enterprises', users: 421, trend: '+28%', icon: '🏗️' },
  { name: 'Startups', users: 1834, trend: '+65%', icon: '🚀' },
];

const ACTIVE_FEATURES = [
  { name: 'AI Content Gen', users: 3245, percentage: 78 },
  { name: 'Automation', users: 2156, percentage: 52 },
  { name: 'Analytics', users: 2834, percentage: 68 },
  { name: 'Integrations', users: 1523, percentage: 37 },
];

const REAL_TIME_EVENTS = [
  { id: 1, type: 'signup', user: 'Alex M.', action: 'Started free trial', time: 'Just now', icon: '🎉' },
  { id: 2, type: 'upgrade', user: 'Sarah C.', action: 'Upgraded to Pro', time: '2 mins ago', icon: '✨' },
  { id: 3, type: 'milestone', user: 'Creative Co.', action: 'Generated 1000 articles', time: '5 mins ago', icon: '🏆' },
  { id: 4, type: 'signup', user: 'Jordan P.', action: 'Joined workspace', time: '7 mins ago', icon: '👋' },
  { id: 5, type: 'usage', user: 'Tech Startup', action: 'High API usage detected', time: '12 mins ago', icon: '⚡' },
  { id: 6, type: 'feedback', user: 'Emma L.', action: 'Gave 5-star review', time: '15 mins ago', icon: '⭐' },
];

export function LiveCustomerMetrics() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 dark:from-green-500/10 dark:to-emerald-500/10 p-8 border border-green-200/50 dark:border-green-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Live Customer Metrics
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time insights into customer activity, usage patterns, and business metrics. Updated every few seconds.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: '5,234', trend: '+12%', icon: '👥' },
          { label: 'Daily Signups', value: '312', trend: '+28%', icon: '🎉' },
          { label: 'Revenue (30d)', value: '$54.2K', trend: '+45%', icon: '💰' },
          { label: 'Churn Rate', value: '2.1%', trend: '-0.3%', icon: '📉' },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{metric.icon}</div>
              <div className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {metric.trend}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Signups (Today)</h3>
            <div className="flex items-center gap-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              <Activity className="w-3 h-3" />
              Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={LIVE_DATA}>
              <defs>
                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="signups" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSignups)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Revenue (Today)</h3>
            <div className="flex items-center gap-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              $54.2K
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={LIVE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Customer Segments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Customer Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CUSTOMER_SEGMENTS.map((segment) => (
            <motion.button
              key={segment.name}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedSegment(segment.name)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedSegment === segment.name
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">{segment.icon}</div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{segment.name}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{segment.users.toLocaleString()}</p>
              <div className="text-xs text-green-600 dark:text-green-400 font-semibold">{segment.trend}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Feature Adoption */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Feature Adoption</h3>
        <div className="space-y-4">
          {ACTIVE_FEATURES.map((feature) => (
            <div key={feature.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{feature.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.users.toLocaleString()} users · {feature.percentage}%
                </p>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${feature.percentage}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Real-time Activity Stream */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white">Real-time Activity</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2">
              <span className="animate-pulse inline-flex h-full w-full rounded-full bg-green-400"></span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">Live Updates</span>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-auto">
          {REAL_TIME_EVENTS.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="text-xl flex-shrink-0">{event.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.user}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{event.action}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 whitespace-nowrap">
                {event.time}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
