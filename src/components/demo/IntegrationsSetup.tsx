'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Check, AlertCircle, ExternalLink, Trash2, Copy } from 'lucide-react';

const INTEGRATIONS_DATA = [
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Send notifications and alerts to your Slack channels',
    status: 'connected',
    actions: ['Send Messages', 'Post Updates', 'Team Alerts'],
    connected_at: '2024-01-15',
    webhook_url: 'hooks.slack.com/services/T...',
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    icon: '🔗',
    description: 'Send data to external services via HTTP POST',
    status: 'configured',
    actions: ['Custom Events', 'Real-time Sync', 'Third-party Apps'],
    connected_at: null,
    configs: [
      { name: 'CRM Sync', url: 'api.crm.com/webhooks', active: true },
      { name: 'Analytics', url: 'analytics.company.com/track', active: true },
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect to 5000+ apps without code',
    status: 'available',
    actions: ['Automate Workflows', 'Multi-app Integration'],
    features: 'Zapier integration ready',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    icon: '🔄',
    description: 'Advanced workflow automation platform',
    status: 'available',
    actions: ['Complex Workflows', 'API Integration'],
    features: 'Native Make connector',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Sync payment data and transactions',
    status: 'available',
    actions: ['Track Revenue', 'Webhook Events'],
    features: 'Payment tracking',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🎯',
    description: 'Sync leads, customers, and deals',
    status: 'available',
    actions: ['Lead Sync', 'Deal Tracking'],
    features: 'CRM integration',
  },
];

export function IntegrationsSetup() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const connected = INTEGRATIONS_DATA.filter(i => i.status === 'connected' || i.status === 'configured');
  const available = INTEGRATIONS_DATA.filter(i => i.status === 'available');

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-500/10 dark:to-red-500/10 p-8 border border-orange-200/50 dark:border-orange-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔗</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Integrations & Setup
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Connect Belsuite with your favorite tools. Sync data, receive notifications, and automate workflows across your entire tech stack.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Connected Integrations */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ✅ Connected Integrations ({connected.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connected.map((integration) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-500/30 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {integration.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                      <Check className="w-3 h-3" />
                      Connected
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {integration.description}
              </p>

              {integration.actions && (
                <div className="space-y-2 mb-4">
                  {integration.actions.map((action) => (
                    <div key={action} className="text-sm text-emerald-700 dark:text-emerald-300">
                      ✓ {action}
                    </div>
                  ))}
                </div>
              )}

              {integration.configs && (
                <div className="space-y-2 mb-4">
                  {integration.configs.map((config) => (
                    <div
                      key={config.name}
                      className="flex items-center justify-between p-2 bg-white dark:bg-black/30 rounded text-sm"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{config.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        config.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {config.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
                <Settings className="w-4 h-4 inline mr-2" />
                Configure
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔓 Available Integrations ({available.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map((integration, index) => (
            <motion.button
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                setSelectedIntegration(integration.id);
                setShowAuthModal(true);
              }}
              className="rounded-2xl bg-white dark:bg-black/30 border-2 border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500 p-6 text-left transition-all hover:shadow-lg"
            >
              <div className="text-4xl mb-3">{integration.icon}</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {integration.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {integration.description}
              </p>
              <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm">
                <ExternalLink className="w-4 h-4" />
                Connect
              </button>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Webhook Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-500/30 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔧 Webhook Configuration
        </h3>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Use these endpoints to receive real-time updates from Belsuite:
          </p>

          <div className="bg-white dark:bg-black/50 rounded-lg p-4 space-y-3">
            {[
              { event: 'Lead Created', endpoint: '/webhooks/leads/created' },
              { event: 'Campaign Completed', endpoint: '/webhooks/campaigns/completed' },
              { event: 'Content Generated', endpoint: '/webhooks/ai/generated' },
              { event: 'Automation Triggered', endpoint: '/webhooks/automation/triggered' },
            ].map((webhook) => (
              <div key={webhook.event} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {webhook.event}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {webhook.endpoint}
                  </p>
                </div>
                <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors">
                  <Copy className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              All webhooks require a valid authentication token in the Authorization header.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Auth Modal */}
      {showAuthModal && selectedIntegration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthModal(false)}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect {INTEGRATIONS_DATA.find(i => i.id === selectedIntegration)?.name}
            </h3>

            <div className="space-y-4 mb-6">
              {selectedIntegration === 'slack' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Slack Workspace URL
                    </span>
                    <input
                      type="text"
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Get your webhook URL from Slack's App Directory
                  </p>
                </div>
              )}

              {selectedIntegration === 'hubspot' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      HubSpot API Key
                    </span>
                    <input
                      type="password"
                      placeholder="pat-..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Connect
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
