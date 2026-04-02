'use client';
import { useCallback, useState } from 'react';

export interface ReferralLink {
  id: string;
  code: string;
  campaignName?: string;
  rewardType: string;
  rewardValue: number;
  maxUses?: number;
  totalClicks: number;
  totalSignups: number;
  totalConverted: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  referrals?: Array<{ status: string }>;
}

export interface ReferralStats {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  totalSignups: number;
  totalConverted: number;
  totalRewardPaid: number;
  signupRate: number;
  conversionRate: number;
  topLinks: Array<{ id: string; code: string; campaignName?: string; converted: number }>;
}

const BASE = '/api/referrals';

export function useReferrals() {
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

  const listLinks = useCallback(() => request<ReferralLink[]>(`${BASE}/links`), [request]);

  const getStats = useCallback(() => request<ReferralStats>(`${BASE}/stats`), [request]);

  const createLink = useCallback((data: { campaignName?: string; rewardType?: string; rewardValue?: number; maxUses?: number; expiresAt?: string }) =>
    request<ReferralLink>(`${BASE}/links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), [request]);

  const trackClick = useCallback((code: string) =>
    request<unknown>(`${BASE}/click/${code}`, { method: 'POST' }), [request]);

  const convert = useCallback((referralId: string) =>
    request<{ status: string }>(`${BASE}/${referralId}/convert`, { method: 'POST' }), [request]);

  return { loading, error, listLinks, getStats, createLink, trackClick, convert };
}
