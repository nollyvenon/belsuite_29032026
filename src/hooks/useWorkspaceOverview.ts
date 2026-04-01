'use client';

import { useCallback, useEffect, useState } from 'react';
import { getWorkspaceOverview, type WorkspaceOverview } from '@/lib/api/modules/workspace';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { getCacheEntry, setCacheEntry, invalidateCache } from '@/lib/api/cache';

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function useWorkspaceOverview() {
  const { rangeDays } = useWorkspaceStore();
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `workspace_overview_${rangeDays}`;

  const load = useCallback(async (useCache = true) => {
    // Try cache first if allowed
    if (useCache) {
      const cached = getCacheEntry<WorkspaceOverview>(cacheKey);
      if (cached) {
        setOverview(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getWorkspaceOverview(rangeDays);
      setCacheEntry(cacheKey, result, CACHE_TTL);
      setOverview(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [rangeDays, cacheKey]);

  useEffect(() => {
    load();
    // Invalidate cache when date range changes
    return () => {
      invalidateCache(cacheKey);
    };
  }, [load, cacheKey]);

  return {
    overview,
    loading,
    error,
    reload: () => load(false),
    invalidateCache: () => invalidateCache(cacheKey),
  };
}