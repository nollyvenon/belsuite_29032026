'use client';
import { useCallback, useState } from 'react';

export interface InboundCall {
  id: string;
  fromNumber: string;
  toNumber: string;
  callerName?: string;
  status: string;
  agentId?: string;
  queueName?: string;
  durationSeconds: number;
  aiSummary?: string;
  sentiment?: string;
  notes?: string;
  answeredAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface CallCenterStats {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  answerRate: number;
  avgDurationSeconds: number;
  agentStats: Array<{ agentId: string; count: number; answered: number; totalDuration: number }>;
}

const BASE = '/api/call-center';

export function useCallCenter() {
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

  const listCalls = useCallback((params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: InboundCall[]; total: number }>(`${BASE}/calls${q}`);
  }, [request]);

  const getLiveQueue = useCallback(() =>
    request<{ queueSize: number; calls: InboundCall[]; longestWaitSeconds: number }>(`${BASE}/queue`), [request]);

  const getStats = useCallback(() => request<CallCenterStats>(`${BASE}/stats`), [request]);

  const logCall = useCallback((data: Partial<InboundCall> & { fromNumber: string; toNumber: string }) =>
    request<InboundCall>(`${BASE}/calls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), [request]);

  const updateCall = useCallback((id: string, data: Partial<InboundCall>) =>
    request<InboundCall>(`${BASE}/calls/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), [request]);

  const summarize = useCallback((id: string) =>
    request<{ summary: string; sentiment: string; topics: string[]; followUpAction: string }>(`${BASE}/calls/${id}/summarize`, { method: 'POST' }), [request]);

  return { loading, error, listCalls, getLiveQueue, getStats, logCall, updateCall, summarize };
}
