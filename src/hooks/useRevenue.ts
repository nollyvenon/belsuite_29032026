'use client';
import { useCallback, useState } from 'react';

export interface RevenueMetrics {
  periodDays: number;
  revenue: {
    total: number;
    prevTotal: number;
    growth: number;
    mrr: number;
    arr: number;
  };
  subscriptions: {
    active: number;
    cancelled: number;
    churnRate: number;
    currentStatus: string;
    planId: string | null;
  };
  pipeline: {
    openDeals: number;
    wonDeals: number;
    pipelineValue: number;
    wonValue: number;
    winRate: number;
    prevWonDeals: number;
  };
  dailyRevenue: Array<{ date: string; revenue: number }>;
}

const BASE = '/api/revenue';

export function useRevenue() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(url: string, opts?: RequestInit): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { credentials: 'include', ...opts });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetrics = useCallback((days?: number) => {
    const q = days ? `?days=${days}` : '';
    return request<RevenueMetrics>(`${BASE}/metrics${q}`);
  }, [request]);

  return { loading, error, getMetrics };
}
