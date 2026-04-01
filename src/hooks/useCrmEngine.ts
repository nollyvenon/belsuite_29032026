'use client';

import { useCallback, useEffect, useState } from 'react';

interface CrmPipelineLead {
  crmLeadId: string;
  stage: string;
  score: number;
  fullName?: string;
  email?: string;
  companyName?: string;
  converted?: boolean;
}

interface CrmStats {
  totals: {
    leadsInPipeline: number;
    converted: number;
    won: number;
    lost: number;
    conversionRate: number;
    winRate: number;
    totalWonValue: number;
  };
  stageDistribution: Array<{ stage: string; count: number }>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/crm-engine${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function useCrmEngine() {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [pipeline, setPipeline] = useState<CrmPipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, pipelineRes] = await Promise.all([
        apiFetch<CrmStats>('/stats?days=30'),
        apiFetch<{ items: CrmPipelineLead[] }>('/pipeline?limit=20&page=1'),
      ]);
      setStats(statsRes);
      setPipeline(pipelineRes.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load CRM engine data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, pipeline, loading, error, reload: load };
}
