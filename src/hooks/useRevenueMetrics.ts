'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRevenueMetrics, type RevenueMetrics } from '@/lib/api/modules/revenue';
import { getCacheEntry, setCacheEntry, invalidateCache } from '@/lib/api/cache';

const CACHE_KEY = 'revenue_metrics';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useRevenueMetrics() {
  const [data, setData] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (useCache = true) => {
    // Try cache first if allowed
    if (useCache) {
      const cached = getCacheEntry<RevenueMetrics>(CACHE_KEY);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getRevenueMetrics(30);
      setCacheEntry(CACHE_KEY, result, CACHE_TTL);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: () => load(false),
    invalidateCache: () => invalidateCache(CACHE_KEY),
  };
}
