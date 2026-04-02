'use client';

import React, { useSyncExternalStore, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Cpu, 
  ArrowUpRight, 
  Sparkles, 
  Mail, 
  UserPlus, 
  Zap,
  Activity,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,  
  Line,
} from 'recharts';
import { AnimatedCounter } from './AnimatedCounter';
import { ENHANCED_MOCK_CHART_DATA, ENHANCED_MOCK_STATS, ENHANCED_MOCK_ACTIVITY } from '@/lib/demo-data-expanded';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, growth, icon: Icon, prefix = "", isAnimated = true }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="group p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <motion.div 
        className="flex items-center gap-1 text-xs font-bold text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        {growth}%
      </motion.div>
    </div>
    <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</div>
    <div className="text-2xl md:text-3xl font-bold font-display mt-2 text-gray-900 dark:text-white">
      {prefix}
      {isAnimated ? (
        <AnimatedCounter end={value} decimals={title.includes('Conversion') ? 1 : 0} />
      ) : (
        value.toLocaleString()
      )}
    </div>
  </motion.div>
);

const ActivityFeedItem = ({ activity, index }: any) => {
  const getIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch(type) {
      case 'ai': return <Sparkles {...iconProps} className="w-4 h-4 text-primary" />;
      case 'lead': return <UserPlus {...iconProps} className="w-4 h-4 text-blue-500" />;
      case 'campaign': return <Zap {...iconProps} className="w-4 h-4 text-orange-500" />;
      case 'revenue': return <DollarSign {...iconProps} className="w-4 h-4 text-green-500" />;
      case 'automation': return <Activity {...iconProps} className="w-4 h-4 text-purple-500" />;
      default: return <Clock {...iconProps} className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      <div className="mt-0.5">
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{activity.message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
      </div>
    </motion.div>
  );
};

export const DashboardViewEnhanced = () => {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [displayStats, setDisplayStats] = useState(ENHANCED_MOCK_STATS);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayStats(prev => ({
        ...prev,
        leads: prev.leads + Math.floor(Math.random() * 10),
        revenue: prev.revenue + Math.floor(Math.random() * 500),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const reversedActivity = [...ENHANCED_MOCK_ACTIVITY].reverse();

  return (
    <div className="space-y-6 pb-20">
      {/* Key Metrics */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">Today's Performance</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Leads Generated" 
            value={displayStats.leads} 
            growth={displayStats.leadsGrowth} 
            icon={Users} 
          />
          <StatCard 
            title="Conversion Rate" 
            value={displayStats.conversion} 
            growth={displayStats.conversionGrowth} 
            icon={TrendingUp} 
          />
          <StatCard 
            title="Revenue Generated" 
            value={displayStats.revenue} 
            growth={displayStats.revenueGrowth} 
            icon={DollarSign} 
            prefix="$"
          />
          <StatCard 
            title="AI Tokens Used" 
            value={displayStats.aiUsage} 
            growth={22.3} 
            icon={Cpu}
            isAnimated={false}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Growth Chart */}
        <div className="lg:col-span-2 p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold font-display mb-6 text-gray-900 dark:text-white">
              Lead Growth & Revenue Performance
            </h3>
            <div className="h-[300px] w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ENHANCED_MOCK_CHART_DATA}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6A00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#FF6A00" 
                      fillOpacity={1} 
                      fill="url(#colorLeads)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* AI Actions Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold font-display mb-4 text-gray-900 dark:text-white">AI Actions</h3>
          <div className="h-[300px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ENHANCED_MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="name" stroke="#88888888" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#88888888" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ai_actions" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Activity Feed + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold font-display mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Live Activity
          </h3>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {reversedActivity.map((activity, index) => (
              <ActivityFeedItem key={activity.id} activity={activity} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="p-4 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Content Generated</p>
            </div>
            <p className="text-3xl font-bold font-display text-gray-900 dark:text-white">
              <AnimatedCounter end={ENHANCED_MOCK_STATS.contentGenerated} />
            </p>
            <p className="text-xs text-gray-500 mt-1">pieces this month</p>
          </div>

          <div className="p-4 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Active Campaigns</p>
            </div>
            <p className="text-3xl font-bold font-display text-gray-900 dark:text-white">
              {ENHANCED_MOCK_STATS.campaignsActive}
            </p>
            <p className="text-xs text-gray-500 mt-1">running now</p>
          </div>

          <div className="p-4 border rounded-2xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Avg Engagement</p>
            </div>
            <p className="text-3xl font-bold font-display text-gray-900 dark:text-white">
              {ENHANCED_MOCK_STATS.avgEngagement}%
            </p>
            <p className="text-xs text-gray-500 mt-1">across all channels</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
