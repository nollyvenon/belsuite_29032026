'use client';

import { useCallback, useEffect, useState } from 'react';

interface LeadStats {
  totals: {
    leads: number;
    visitors: number;
    averageLeadScore: number;
  };
  bySource: Array<{ source: string; count: number }>;
  topLeads: Array<Record<string, unknown>>;
}

interface LeadItem {
  id: string;
  timestamp?: string;
  leadScore?: number;
  source?: string;
  prospect?: {
    fullName?: string;
    email?: string;
    companyName?: string;
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/lead-engine${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function useLeadEngine() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, leadsRes] = await Promise.all([
        apiFetch<LeadStats>('/stats?days=30'),
        apiFetch<{ items: LeadItem[] }>('/leads?limit=20&page=1'),
      ]);
      setStats(statsRes);
      setLeads(leadsRes.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load lead engine data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, leads, loading, error, reload: load };
}
