'use client';

import React from 'react';
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
  Zap 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { MOCK_CHART_DATA, MOCK_ACTIVITY } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, growth, icon: Icon, prefix = "" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-green-500">
        <ArrowUpRight className="w-3 h-3" />
        {growth}%
      </div>
    </div>
    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
    <div className="text-2xl font-bold font-display mt-1">
      {prefix}{value.toLocaleString()}
    </div>
  </motion.div>
);

export const DashboardView = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Leads Generated" value={2340} growth={12.5} icon={Users} />
        <StatCard title="Campaign Conversions" value={38.2} growth={4.1} icon={TrendingUp} />
        <StatCard title="Revenue Generated" value={12430} growth={18.7} icon={DollarSign} prefix="$" />
        <StatCard title="AI Tokens Used" value={84200} growth={22.3} icon={Cpu} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <h3 className="text-lg font-bold font-display mb-6">Lead Growth Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888888' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #333',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#FF6A00" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <h3 className="text-lg font-bold font-display mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {MOCK_ACTIVITY.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  item.type === 'ai' ? "bg-primary/10 text-primary" :
                  item.type === 'campaign' ? "bg-blue-500/10 text-blue-500" :
                  item.type === 'lead' ? "bg-green-500/10 text-green-500" :
                  "bg-gray-500/10 text-gray-500"
                )}>
                  {item.type === 'ai' && <Sparkles className="w-5 h-5" />}
                  {item.type === 'campaign' && <Zap className="w-5 h-5" />}
                  {item.type === 'lead' && <UserPlus className="w-5 h-5" />}
                  {item.type === 'system' && <Mail className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-medium leading-tight">{item.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="w-full mt-8 py-2 text-sm font-medium text-primary hover:underline">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
};
