'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, Database, DollarSign } from 'lucide-react';

export interface AIUsageStats {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  totalCached: number;
  byModel: Record<string, any>;
  byProvider: Record<string, any>;
  lastUsedAt: string;
}

export const AIDashboard = () => {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, cacheRes] = await Promise.all([
        fetch('/api/ai/usage/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }),
        fetch('/api/ai/cache/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      if (cacheRes.ok) {
        const data = await cacheRes.json();
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Usage Dashboard</h1>
        <p className="text-black/60 dark:text-white/60">
          Monitor your AI generation usage, costs, and cache performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-2">Total Requests</p>
              <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
              <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                This month
              </p>
            </div>
            <Zap className="w-8 h-8 text-primary/50" />
          </div>
        </motion.div>

        {/* Total Cost */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-2">Total Cost</p>
              <p className="text-3xl font-bold">${(stats?.totalCost || 0).toFixed(2)}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                {stats?.totalCached || 0} cached (saved cost)
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/50" />
          </div>
        </motion.div>

        {/* Total Tokens */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-2">Total Tokens</p>
              <p className="text-3xl font-bold">{(stats?.totalTokens || 0).toLocaleString()}</p>
              <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                Input + completion
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/50" />
          </div>
        </motion.div>

        {/* Cache Size */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-2">Cached Entries</p>
              <p className="text-3xl font-bold">{cacheStats?.entries || 0}</p>
              <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                {((cacheStats?.totalSize || 0) / 1024).toFixed(1)} KB
              </p>
            </div>
            <Database className="w-8 h-8 text-primary/50" />
          </div>
        </motion.div>
      </div>

      {/* Usage by Model */}
      {stats?.byModel && Object.keys(stats.byModel).length > 0 && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <h2 className="text-lg font-semibold mb-4">Usage by Model</h2>
          <div className="space-y-3">
            {Object.entries(stats.byModel).map(([model, data]: [string, any]) => (
              <div key={model}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{model}</span>
                  <span className="text-black/60 dark:text-white/60">
                    {data.count} requests • ${data.cost.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(data.count / (stats.totalRequests || 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Usage by Provider */}
      {stats?.byProvider && Object.keys(stats.byProvider).length > 0 && (
        <motion.div
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <h2 className="text-lg font-semibold mb-4">Usage by Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byProvider).map(([provider, data]: [string, any]) => (
              <div key={provider} className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                <p className="font-semibold mb-2">{provider}</p>
                <div className="space-y-1 text-sm text-black/60 dark:text-white/60">
                  <p>Requests: {data.count}</p>
                  <p>Cost: ${data.cost.toFixed(2)}</p>
                  <p>Tokens: {data.tokens.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cache Performance */}
      {cacheStats && (
        <motion.div
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <h2 className="text-lg font-semibold mb-4">Cache Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Entries</p>
              <p className="text-2xl font-bold">{cacheStats.entries}</p>
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Total Hits</p>
              <p className="text-2xl font-bold">{cacheStats.totalHits}</p>
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Avg Size</p>
              <p className="text-2xl font-bold">{(cacheStats.avgSize / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Hit Rate</p>
              <p className="text-2xl font-bold">
                {cacheStats.entries > 0
                  ? ((cacheStats.totalHits / (cacheStats.entries * 10)) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Last Used */}
      {stats?.lastUsedAt && (
        <div className="text-sm text-black/60 dark:text-white/60">
          Last used: {new Date(stats.lastUsedAt).toLocaleDateString()} at{' '}
          {new Date(stats.lastUsedAt).toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
};

export default AIDashboard;
