'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AutopilotPolicy {
  id: string;
  name: string;
  description?: string;
  scope: 'campaigns' | 'funnels' | 'messaging' | 'full_stack';
  pauseRoiThreshold: number;
  scaleRoiThreshold: number;
  scaleBudgetPercent: number;
  autoRun: boolean;
  runCron?: string;
  createdAt: string;
}

export interface AutopilotRun {
  id: string;
  eventType: 'autopilot.run.requested' | 'autopilot.run.completed';
  timestamp: string;
  runId?: string;
  policyId?: string;
  reason?: string;
  status?: string;
  actionCount?: number;
  actions?: Array<Record<string, unknown>>;
}

export interface AutopilotInsights {
  periodDays: number;
  totals: {
    autopilotRuns: number;
    campaigns: number;
    activeCampaigns: number;
    pausedCampaigns: number;
  };
  campaigns: Array<{
    campaignId: string;
    campaignName: string;
    status: string;
    spend: number;
    revenue: number;
    conversions: number;
    roi: number;
  }>;
  aiInsights: {
    working: string[];
    notWorking: string[];
    recommendations: string[];
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ai-autopilot${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export function useAIAutopilot() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<AutopilotPolicy[]>([]);
  const [runs, setRuns] = useState<AutopilotRun[]>([]);
  const [insights, setInsights] = useState<AutopilotInsights | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [policiesRes, runsRes, insightsRes] = await Promise.all([
        apiFetch<AutopilotPolicy[]>('/policies'),
        apiFetch<{ items: AutopilotRun[] }>('/runs?page=1&limit=20'),
        apiFetch<AutopilotInsights>('/insights?days=30'),
      ]);

      setPolicies(policiesRes || []);
      setRuns(runsRes.items || []);
      setInsights(insightsRes);
    } catch (e: any) {
      setError(e.message || 'Failed to load AI Autopilot data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPolicy = useCallback(
    (payload: {
      name: string;
      description?: string;
      scope?: 'campaigns' | 'funnels' | 'messaging' | 'full_stack';
      pauseRoiThreshold?: number;
      scaleRoiThreshold?: number;
      scaleBudgetPercent?: number;
      autoRun?: boolean;
      runCron?: string;
      constraints?: Record<string, unknown>;
    }) =>
      apiFetch<AutopilotPolicy>('/policies', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  const triggerRun = useCallback(
    (payload?: { policyId?: string; reason?: string; context?: Record<string, unknown> }) =>
      apiFetch<{ runId: string; status: string }>('/runs/trigger', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }),
    [],
  );

  return {
    loading,
    error,
    policies,
    runs,
    insights,
    reload: load,
    createPolicy,
    triggerRun,
  };
}
