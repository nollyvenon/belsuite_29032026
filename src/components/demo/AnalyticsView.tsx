'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Target, 
  Globe 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { MOCK_CHART_DATA } from '@/src/lib/demo-data';
import { cn } from '@/src/lib/utils';

const PIE_DATA = [
  { name: 'Email', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Ads', value: 300 },
  { name: 'Direct', value: 200 },
];

const COLORS = ['#FF6A00', '#FF9D00', '#FFC100', '#FFE500'];

const InsightCard = ({ icon: Icon, title, description, trend }: any) => (
  <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-lg font-bold font-display">{title}</h4>
    </div>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full",
      trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
    )}>
      {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {trend === 'up' ? "+15.2%" : "-4.5%"}
    </div>
  </div>
);

export const AnalyticsView = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Advanced Analytics</h2>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-bold border rounded-xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 hover:bg-black/5 dark:hover:bg-white/5">
            Export Report
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-primary hover:orange-glow transition-all">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <h3 className="text-lg font-bold font-display mb-6">Revenue Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
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
                  cursor={{ fill: '#88888811' }}
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #333',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="revenue" fill="#FF6A00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <h3 className="text-lg font-bold font-display mb-6">Lead Sources Breakdown</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #333',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {PIE_DATA.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <InsightCard 
          icon={Sparkles} 
          title="AI Content Insight" 
          description="Your best performing content is 'Educational Videos'. Try increasing production by 20%."
          trend="up"
        />
        <InsightCard 
          icon={Target} 
          title="Campaign ROI" 
          description="The 'Summer Sale' campaign has achieved a 4.2x ROI, exceeding targets by 15%."
          trend="up"
        />
        <InsightCard 
          icon={Globe} 
          title="Global Reach" 
          description="Traffic from Europe has decreased. Consider localized ad variants for better engagement."
          trend="down"
        />
      </div>
    </div>
  );
};
