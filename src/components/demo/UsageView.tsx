'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  Database, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const UsageCard = ({ icon: Icon, title, value, limit, unit, color }: any) => {
  const percentage = (value / limit) * 100;
  
  return (
    <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-2 rounded-xl", `bg-${color}-500/10 text-${color}-500`)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</div>
      </div>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold font-display">{value.toLocaleString()}</span>
        <span className="text-sm text-gray-500">/ {limit.toLocaleString()} {unit}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", `bg-${color}-500`)}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-500">
        <span>{percentage.toFixed(1)}% used</span>
        <span>{limit - value} {unit} remaining</span>
      </div>
    </div>
  );
};

export const UsageView = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">AI Usage Monitor</h2>
        <button className="flex items-center gap-2 px-6 py-2 font-bold text-white rounded-xl bg-primary hover:orange-glow transition-all">
          <Zap className="w-5 h-5" /> Upgrade Plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UsageCard 
          icon={Cpu} 
          title="AI Tokens" 
          value={84200} 
          limit={100000} 
          unit="tokens" 
          color="orange" 
        />
        <UsageCard 
          icon={Database} 
          title="Lead Storage" 
          value={2340} 
          limit={5000} 
          unit="leads" 
          color="blue" 
        />
        <UsageCard 
          icon={HardDrive} 
          title="Media Storage" 
          value={12.4} 
          limit={50} 
          unit="GB" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-8 border rounded-3xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <h3 className="text-xl font-bold font-display mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">API Latency</span>
              </div>
              <span className="text-sm font-bold">124ms</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Security Status</span>
              </div>
              <span className="text-sm font-bold text-green-500">Secure</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Current Plan</span>
              </div>
              <span className="text-sm font-bold">Pro Monthly</span>
            </div>
          </div>
        </div>

        <div className="p-8 border rounded-3xl dark:border-white/10 border-black/5 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Zap className="w-12 h-12 text-primary/20" />
          </div>
          <h3 className="text-xl font-bold font-display mb-4">Need more power?</h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Upgrade to the Business plan to unlock unlimited AI tokens, custom model training, and priority support.
          </p>
          <button className="flex items-center gap-2 px-8 py-3 font-bold text-white rounded-xl bg-primary hover:orange-glow transition-all">
            View Enterprise Plans <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
