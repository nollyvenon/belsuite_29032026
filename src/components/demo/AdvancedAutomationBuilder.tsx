'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Play, Settings, LogOut, GitBranch, Zap, Code2 } from 'lucide-react';

const TRIGGERS = [
  { id: 'schedule', label: 'Schedule', icon: '⏰', description: 'Run on specific dates/times' },
  { id: 'trigger', label: 'Trigger Event', icon: '⚡', description: 'Lead score, form submission, etc.' },
  { id: 'webhook', label: 'Webhook', icon: '🔗', description: 'External event from other apps' },
];

const ACTIONS = [
  { id: 'generate', label: 'Generate Content', icon: '✨', description: 'AI generates social/email/ad copy' },
  { id: 'send-email', label: 'Send Email', icon: '📧', description: 'Send to individual or list' },
  { id: 'post', label: 'Post to Social', icon: '📱', description: 'Instagram, LinkedIn, Twitter, etc.' },
  { id: 'slack', label: 'Send Slack Message', icon: '💬', description: 'Notify team in Slack' },
  { id: 'webhook-out', label: 'Call Webhook', icon: '🔗', description: 'Send data to external service' },
  { id: 'branch', label: 'Conditional Branch', icon: '🔀', description: 'If/then logic based on data' },
  { id: 'delay', label: 'Wait/Delay', icon: '⏱️', description: 'Pause for hours/days' },
  { id: 'lead-score', label: 'Update Lead Score', icon: '📈', description: 'Adjust lead qualification' },
];

export function AdvancedAutomationBuilder() {
  const [workflow, setWorkflow] = useState<any[]>([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(true);

  const addTrigger = (triggerId: string) => {
    setWorkflow([{ type: 'trigger', id: triggerId, label: TRIGGERS.find(t => t.id === triggerId)?.label }]);
    setShowTriggerModal(false);
  };

  const addAction = (actionId: string) => {
    setWorkflow([...workflow, { type: 'action', id: actionId, label: ACTIONS.find(a => a.id === actionId)?.label }]);
    setShowActionModal(false);
  };

  const removeStep = (index: number) => {
    setWorkflow(workflow.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-500/10 dark:to-pink-500/10 p-8 border border-purple-200/50 dark:border-purple-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">⚙️</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Advanced Automation Builder
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Create powerful workflows with visual automation. Connect triggers, actions, and conditionals without any code.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setIsBuilding(true)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            isBuilding
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Code2 className="w-4 h-4 inline mr-2" />
          Visual Builder
        </button>
        <button
          onClick={() => setIsBuilding(false)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            !isBuilding
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <GitBranch className="w-4 h-4 inline mr-2" />
          Code Editor
        </button>
      </div>

      {isBuilding ? (
        <>
          {/* Workflow Builder */}
          <div className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Build Your Workflow
            </h3>

            {/* Workflow Visualization */}
            <div className="space-y-4 mb-8">
              <AnimatePresence>
                {workflow.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start by selecting a trigger to begin your workflow</p>
                  </motion.div>
                ) : (
                  <>
                    {workflow.map((step, index) => (
                      <React.Fragment key={index}>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="relative"
                        >
                          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                            <div className="text-2xl">
                              {step.type === 'trigger' ? '▶️' : '→'}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {step.label}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {step.type === 'trigger' ? 'Trigger point' : 'Action step'}
                              </p>
                            </div>
                            <button
                              onClick={() => removeStep(index)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        </motion.div>

                        {index < workflow.length - 1 && (
                          <div className="flex justify-center py-2">
                            <div className="text-2xl text-gray-400">↓</div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Add Step Buttons */}
            <div className="flex gap-4 flex-wrap">
              {workflow.length === 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowTriggerModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Trigger
                </motion.button>
              )}

              {workflow.length > 0 && workflow[0].type === 'trigger' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowActionModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Action
                </motion.button>
              )}

              {workflow.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Test Workflow
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Save & Deploy
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Modals */}
          <AnimatePresence>
            {showTriggerModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTriggerModal(false)}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Select a Trigger
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TRIGGERS.map((trigger) => (
                      <button
                        key={trigger.id}
                        onClick={() => addTrigger(trigger.id)}
                        className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                      >
                        <div className="text-3xl mb-2">{trigger.icon}</div>
                        <p className="font-bold text-gray-900 dark:text-white">{trigger.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {trigger.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showActionModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowActionModal(false)}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-auto"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Select an Action
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => addAction(action.id)}
                        className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left"
                      >
                        <div className="text-3xl mb-2">{action.icon}</div>
                        <p className="font-bold text-gray-900 dark:text-white">{action.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Code Editor Mode */
        <div className="rounded-2xl bg-gray-900 text-gray-100 p-6 font-mono text-sm overflow-auto">
          <pre>{`// Advanced Automation Examples

// Example 1: Lead Scoring Workflow
{
  trigger: 'schedule',
  frequency: 'daily',
  actions: [
    { type: 'generateContent', channel: 'email' },
    { type: 'sendEmail', template: 'daily_digest' },
    { type: 'updateLeadScore', min_score: 80 },
    { type: 'slackNotify', channel: '#sales' }
  ]
}

// Example 2: Event-Based Automation
{
  trigger: 'webhook',
  event: 'form_submission',
  conditions: [
    { field: 'company_size', operator: '>', value: 100 }
  ],
  actions: [
    { type: 'generateContent', type: 'email' },
    { type: 'sendEmail', to: 'sales@company.com' },
    { type: 'createLead', source: 'web_form' },
    { type: 'webhookCall', url: 'crm.example.com/api/leads' }
  ]
}`}</pre>
        </div>
      )}

      {/* Template Library */}
      <div className="rounded-2xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Pre-Built Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Daily Content Blast', tasks: '3 actions' },
            { name: 'Lead Qualification Flow', tasks: '5 actions' },
            { name: 'Email Nurture Sequence', tasks: '7 steps' },
            { name: 'Social Media Scheduler', tasks: '4 actions' },
            { name: 'Slack Team Notifications', tasks: '2 actions' },
            { name: 'Multi-Channel Campaign', tasks: '8 steps' },
          ].map((template) => (
            <motion.button
              key={template.name}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 text-left transition-all"
            >
              <p className="font-bold text-gray-900 dark:text-white">{template.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{template.tasks}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
