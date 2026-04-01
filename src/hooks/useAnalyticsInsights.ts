'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAnalyticsTrends, getContentPipelineMetrics, type TrendDataPoint, type PipelineMetrics } from '@/lib/api/modules/insights';
import { getCacheEntry, setCacheEntry, invalidateCache } from '@/lib/api/cache';

const TRENDS_CACHE_KEY = 'analytics_trends';
const PIPELINE_CACHE_KEY = 'content_pipeline';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAnalyticsTrends() {
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (useCache = true) => {
    if (useCache) {
      const cached = getCacheEntry<TrendDataPoint[]>(TRENDS_CACHE_KEY);
      if (cached) {
        setTrends(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getAnalyticsTrends(7);
      setCacheEntry(TRENDS_CACHE_KEY, result, CACHE_TTL);
      setTrends(result);
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
    trends,
    loading,
    error,
    reload: () => load(false),
    invalidateCache: () => invalidateCache(TRENDS_CACHE_KEY),
  };
}

export function useContentPipelineMetrics() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (useCache = true) => {
    if (useCache) {
      const cached = getCacheEntry<PipelineMetrics>(PIPELINE_CACHE_KEY);
      if (cached) {
        setMetrics(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getContentPipelineMetrics();
      setCacheEntry(PIPELINE_CACHE_KEY, result, CACHE_TTL);
      setMetrics(result);
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
    metrics,
    loading,
    error,
    reload: () => load(false),
    invalidateCache: () => invalidateCache(PIPELINE_CACHE_KEY),
  };
}
