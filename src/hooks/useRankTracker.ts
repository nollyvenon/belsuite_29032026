'use client';
import { useCallback, useState } from 'react';

export interface KeywordRank {
  id: string;
  keyword: string;
  domain: string;
  position?: number;
  previousPos?: number;
  searchVolume?: number;
  difficulty?: number;
  country: string;
  device: string;
  trackedAt: string;
  movement?: number;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: string;
  suggestedUrl?: string;
}

const BASE = '/api/rank-tracker';

export function useRankTracker() {
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

  const listRanks = useCallback((params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: KeywordRank[]; total: number }>(`${BASE}${q}`);
  }, [request]);

  const getStats = useCallback(() =>
    request<{ uniqueKeywords: number; top10Rankings: number; top3Rankings: number; avgPosition: number | null }>(`${BASE}/stats`), [request]);

  const trackKeyword = useCallback((data: { keyword: string; domain: string; country?: string }) =>
    request<KeywordRank>(`${BASE}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), [request]);

  const bulkTrack = useCallback((data: { domain: string; keywords: string[]; country?: string }) =>
    request<{ tracked: number }>(`${BASE}/bulk-track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), [request]);

  const research = useCallback((data: { seedKeyword: string; industry?: string; country?: string; count?: number }) =>
    request<{ seedKeyword: string; suggestions: KeywordSuggestion[]; count: number }>(
      `${BASE}/research`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
    ), [request]);

  const getHistory = useCallback((keyword: string, domain: string, days?: number) => {
    const q = new URLSearchParams({ keyword, domain, ...(days ? { days: String(days) } : {}) });
    return request<KeywordRank[]>(`${BASE}/history?${q}`);
  }, [request]);

  return { loading, error, listRanks, getStats, trackKeyword, bulkTrack, research, getHistory };
}
