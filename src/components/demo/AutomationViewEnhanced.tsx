'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Plus, Pause, Play, Trash2, Edit, ChevronRight, Copy } from 'lucide-react';
import { MOCK_AUTOMATIONS } from '@/lib/demo-data-expanded';
import { cn } from '@/lib/utils';

const ActionBadge = ({ action, index }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center gap-2"
  >
    <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-semibold whitespace-nowrap">
      {action}
    </div>
    {index < 3 && <ChevronRight className="w-4 h-4 text-gray-400" />}
  </motion.div>
);

const AutomationCard = ({ automation, index }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border dark:border-white/10 border-black/5 rounded-2xl bg-white/50 dark:bg-black/20 overflow-hidden hover:bg-white/80 dark:hover:bg-black/40 transition-all"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              {automation.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trigger: {automation.trigger}
            </p>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-bold',
            automation.status === 'Active'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
          )}>
            {automation.status}
          </div>
        </div>

        {/* Action Flow Preview */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {automation.actions.slice(0, 3).map((action, i) => (
            <ActionBadge key={i} action={action} index={i} />
          ))}
          {automation.actions.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{automation.actions.length - 3}
            </span>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {automation.executions} executions • Next: {automation.nextRun}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t dark:border-white/5 border-black/5 px-6 py-4 bg-black/5 dark:bg-white/5"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">All Actions</p>
                <div className="space-y-2">
                  {automation.actions.map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{action}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 text-xs font-bold border rounded-lg dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button className="flex items-center justify-center gap-2 py-2 text-xs font-bold border rounded-lg dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AutomationViewEnhanced = () => {
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white mb-2">
            Workflow Automation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create powerful automations to scale your business without manual work
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:orange-glow transition-all font-bold">
          <Plus className="w-5 h-5" />
          New Automation
        </button>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b dark:border-white/10 border-black/5"
      >
        {(['list', 'builder'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'px-4 py-3 font-bold transition-all capitalize',
              viewMode === mode
                ? 'border-b-2 border-b-primary text-primary'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {mode === 'list' ? '📋 My Automations' : '🔨 Builder'}
          </button>
        ))}
      </motion.div>

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {MOCK_AUTOMATIONS.map((automation, index) => (
            <AutomationCard key={automation.id} automation={automation} index={index} />
          ))}
        </motion.div>
      )}

      {/* Builder View */}
      {viewMode === 'builder' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="p-8 border-2 border-dashed dark:border-white/10 border-black/10 rounded-2xl text-center bg-white/50 dark:bg-black/20">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Create a New Automation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Set up triggers and actions to automate repetitive tasks
            </p>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:orange-glow transition-all font-bold mx-auto">
              <Plus className="w-5 h-5" />
              Start Building
            </button>
          </div>

          {/* Builder Example */}
          <div className="p-6 border dark:border-white/10 border-black/5 rounded-2xl bg-white/50 dark:bg-black/20">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Example Workflow</h4>
            <div className="space-y-4">
              {[
                { label: 'Trigger', value: 'New lead score > 80', icon: '🎯' },
                { label: 'Action 1', value: 'Send welcome email', icon: '📧' },
                { label: 'Action 2', value: 'Add to CRM segment', icon: '📊' },
                { label: 'Action 3', value: 'Schedule follow-up call', icon: '📞' },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 border dark:border-white/10 border-black/5 rounded-lg bg-black/5 dark:bg-white/5"
                >
                  <span className="text-2xl">{step.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{step.label}</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{step.value}</p>
                  </div>
                  {index < 3 && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
