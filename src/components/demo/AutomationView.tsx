'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Play, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  ArrowRight, 
  Settings, 
  Clock, 
  Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WorkflowNode = ({ icon: Icon, title, description, type, active = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn(
      "relative p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 shadow-lg min-w-[280px]",
      active ? "border-primary ring-2 ring-primary/20" : ""
    )}
  >
    {active && (
      <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white orange-glow">
        <Zap className="w-4 h-4 animate-pulse" />
      </div>
    )}
    <div className="flex items-center gap-4 mb-4">
      <div className={cn(
        "p-3 rounded-xl",
        type === 'trigger' ? "bg-blue-500/10 text-blue-500" :
        type === 'action' ? "bg-primary/10 text-primary" :
        "bg-green-500/10 text-green-500"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm font-bold font-display uppercase tracking-wider text-gray-500">{type}</div>
        <h4 className="text-lg font-bold font-display">{title}</h4>
      </div>
    </div>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    <div className="mt-4 pt-4 border-t dark:border-white/5 border-black/5 flex items-center justify-between">
      <button className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
        <Settings className="w-3 h-3" /> Configure
      </button>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" /> Instant
      </div>
    </div>
  </motion.div>
);

export const AutomationView = () => {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaign Automation</h2>
          <p className="text-gray-500">Design and automate your customer journey with AI.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 font-bold text-white rounded-xl bg-primary hover:orange-glow transition-all">
          <Plus className="w-5 h-5" /> New Workflow
        </button>
      </div>

      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-12 py-12">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10 rounded-full" />
        
        <WorkflowNode 
          icon={Zap} 
          title="New Lead Captured" 
          description="Triggered when a lead signs up via the website or social ads."
          type="trigger"
        />

        <div className="flex items-center justify-center text-primary">
          <ArrowRight className="w-8 h-8 lg:rotate-0 rotate-90" />
        </div>

        <WorkflowNode 
          icon={Mail} 
          title="Send Welcome Email" 
          description="AI-personalized welcome email sent instantly to the lead."
          type="action"
          active={true}
        />

        <div className="flex items-center justify-center text-primary">
          <ArrowRight className="w-8 h-8 lg:rotate-0 rotate-90" />
        </div>

        <WorkflowNode 
          icon={PhoneCall} 
          title="AI Voice Call" 
          description="Schedule an AI-powered discovery call if lead score > 80."
          type="action"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <div className="text-sm font-bold text-gray-500 mb-2">Active Workflows</div>
          <div className="text-3xl font-bold font-display">12</div>
        </div>
        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <div className="text-sm font-bold text-gray-500 mb-2">Automations Triggered</div>
          <div className="text-3xl font-bold font-display">4,230</div>
        </div>
        <div className="p-6 border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
          <div className="text-sm font-bold text-gray-500 mb-2">Time Saved</div>
          <div className="text-3xl font-bold font-display">124h</div>
        </div>
      </div>
    </div>
  );
};
