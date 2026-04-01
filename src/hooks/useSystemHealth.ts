'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSystemHealth, type SystemHealth } from '@/lib/api/modules/system';
import { getCacheEntry, setCacheEntry, invalidateCache } from '@/lib/api/cache';

const CACHE_KEY = 'system_health';
const CACHE_TTL = 30 * 1000; // 30 seconds for system health

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (useCache = true) => {
    if (useCache) {
      const cached = getCacheEntry<SystemHealth>(CACHE_KEY);
      if (cached) {
        setHealth(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getSystemHealth();
      setCacheEntry(CACHE_KEY, result, CACHE_TTL);
      setHealth(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh system health more frequently
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, [load]);

  return {
    health,
    loading,
    error,
    reload: () => load(false),
    invalidateCache: () => invalidateCache(CACHE_KEY),
  };
}
