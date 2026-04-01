'use client';

import { useCallback, useEffect, useState } from 'react';

interface MarketingAutomationCampaign {
  id: string;
  name: string;
  objective: string;
  isActive: boolean;
  channels: string[];
  trigger: { mode: string; eventName?: string };
  executionCount: number;
}

interface MarketingAutomationStats {
  totals: {
    campaigns: number;
    activeCampaigns: number;
    runs: number;
    triggeredRuns: number;
    messagesSent: number;
  };
  byChannel: Array<{ channel: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/marketing-automation${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function useMarketingAutomation() {
  const [stats, setStats] = useState<MarketingAutomationStats | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingAutomationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        apiFetch<MarketingAutomationStats>('/stats?days=30'),
        apiFetch<{ items: MarketingAutomationCampaign[] }>('/campaigns?limit=20&page=1'),
      ]);
      setStats(statsRes);
      setCampaigns(campaignsRes.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load marketing automation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generateCopy = useCallback(
    (payload: {
      objective: string;
      offer: string;
      audience: string;
      channel?: string;
      tone?: string;
      variantCount?: number;
    }) =>
      apiFetch<Record<string, unknown>>('/ai/copy/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  return { stats, campaigns, loading, error, reload: load, generateCopy };
}
