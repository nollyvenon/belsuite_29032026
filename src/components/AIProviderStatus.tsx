'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const AIProviderStatus = () => {
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(fetchProviders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/ai/providers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking providers...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
    >
      <h3 className="text-sm font-semibold mb-3">AI Provider Status</h3>

      <div className="space-y-2">
        {Object.entries(providers).map(([provider, isAvailable]) => (
          <motion.div
            key={provider}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5"
          >
            <div className="flex items-center gap-2">
              {isAvailable ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium capitalize">{provider}</span>
            </div>

            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                isAvailable
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 text-xs text-black/60 dark:text-white/60">
        Status checked: {new Date().toLocaleTimeString()}
      </div>
    </motion.div>
  );
};

export default AIProviderStatus;
