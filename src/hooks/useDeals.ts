'use client';
import { useCallback, useState } from 'react';

export interface Deal {
  id: string;
  title: string;
  contactEmail?: string;
  contactName?: string;
  companyName?: string;
  stage: string;
  priority: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseAt?: string;
  closedAt?: string;
  ownerId?: string;
  pipelineName: string;
  notes?: string;
  aiScore?: number;
  aiNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardView {
  board: Record<string, Deal[]>;
  totals: Array<{ stage: string; count: number; value: number }>;
}

export interface DealStats {
  total: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  wonValue: number;
  winRate: number;
  newThisMonth: number;
  avgDealValue: number;
}

/** Laravel Octane CRM deals (Nest parity paths via Next rewrites). */
const BASE = '/api/v1/crm/deals';

function apiHeaders(extra?: HeadersInit): Record<string, string> {
  const merged = new Headers(extra ?? undefined);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const org = localStorage.getItem('organizationId');
    if (token) {
      merged.set('Authorization', `Bearer ${token}`);
    }
    if (org) {
      merged.set('X-Tenant-ID', org);
    }
  }
  const out: Record<string, string> = {};
  merged.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body: unknown = await res.json();
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    (body as { success?: boolean }).success === true &&
    'data' in body
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function useDeals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(url: string, opts?: RequestInit): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        credentials: 'include',
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...apiHeaders(opts?.headers),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseEnvelope<T>(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBoard = useCallback(() => request<BoardView>(`${BASE}/board`), [request]);

  const getStats = useCallback(() => request<DealStats>(`${BASE}/stats`), [request]);

  const listDeals = useCallback((params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: Deal[]; total: number; page?: number; limit?: number }>(`${BASE}${q}`);
  }, [request]);

  const getDeal = useCallback((id: string) => request<Deal & { activities: unknown[] }>(`${BASE}/${id}`), [request]);

  const createDeal = useCallback(
    (data: Partial<Deal> & { title: string }) =>
      request<Deal>(BASE, { method: 'POST', body: JSON.stringify(data) }),
    [request],
  );

  const updateDeal = useCallback(
    (id: string, data: Partial<Deal>) =>
      request<Deal>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    [request],
  );

  const deleteDeal = useCallback(
    (id: string) => request<{ deleted: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
    [request],
  );

  const aiScore = useCallback(
    (id: string) =>
      request<{ score: number; reasoning: string; nextBestAction: string }>(`${BASE}/${id}/ai-score`, {
        method: 'POST',
      }),
    [request],
  );

  const getTimeline = useCallback(
    (email: string) => request<unknown>(`${BASE}/contact/${encodeURIComponent(email)}/timeline`),
    [request],
  );

  return { loading, error, getBoard, getStats, listDeals, getDeal, createDeal, updateDeal, deleteDeal, aiScore, getTimeline };
}
