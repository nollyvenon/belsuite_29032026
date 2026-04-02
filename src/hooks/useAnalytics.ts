'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AnalyticsModuleMetric {
  module: 'CONTENT' | 'SOCIAL' | 'VIDEO' | 'MARKETING' | 'PAYMENTS';
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
}

export interface AnalyticsOverview {
  periodDays: number;
  totalEvents: number;
  trackedViews: number;
  engagements: number;
  engagementRate: number;
  totalRevenue: number;
  attributedRevenue: number;
  conversions: number;
  publishedContent: number;
  publishedPosts: number;
  videosReady: number;
  activeCampaigns: number;
  moduleBreakdown: AnalyticsModuleMetric[];
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  views: number;
  engagements: number;
  revenue: number;
  attributedRevenue: number;
  conversions: number;
  publishedContent: number;
  publishedPosts: number;
  videosReady: number;
}

export interface EngagementBreakdownItem {
  label: string;
  value: number;
  percentage: number;
}

export interface RevenueAttributionRow {
  source: string;
  medium: string | null;
  campaign: string | null;
  revenue: number;
  conversions: number;
  percentage: number;
}

export interface TopContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  engagements: number;
  engagementRate: number;
  score: number;
  publishedAt: string | null;
}

export interface AnalyticsInsight {
  title: string;
  summary: string;
  action: string;
  type: 'positive' | 'warning' | 'opportunity';
  confidence: number;
}

export interface AnalyticsDashboardResponse {
  overview: AnalyticsOverview;
  performanceChart: AnalyticsTimeseriesPoint[];
  engagementBreakdown: {
    byType: EngagementBreakdownItem[];
    byChannel: EngagementBreakdownItem[];
  };
  revenueAttribution: RevenueAttributionRow[];
  topContent: TopContentItem[];
}

export interface AnalyticsIntelligence {
  periodDays: number;
  campaignPerformance: Array<{
    campaignId: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    cvr: number;
    roas: number;
    roi: number;
  }>;
  roi: {
    spend: number;
    campaignRevenue: number;
    collectedRevenue: number;
    netROI: number;
    paybackSignal: string;
  };
  leadConversion: {
    leads: number;
    customers: number;
    leadToCustomerRate: number;
  };
  channelPerformance: Array<{
    channel: string;
    revenue: number;
    conversions: number;
    share: number;
  }>;
  aiInsights: {
    working: string[];
    notWorking: string[];
    recommendations: string[];
    churn: Array<{
      segment: string;
      riskScore: number;
      reason: string;
      recommendedAction: string;
    }>;
  };
}

export interface AnalyticsTrackEventInput {
  eventType: string;
  contentId?: string;
  entityType?: string;
  entityId?: string;
  sessionId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  channel?: string;
  value?: number;
  timestamp?: string;
  properties?: Record<string, unknown>;
}

const ANALYTICS_SESSION_KEY = 'belsuite.analytics.session-id';

function authHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/analytics${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return undefined;

  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;

  const created = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, created);
  return created;
}

export async function sendAnalyticsEvent(body: AnalyticsTrackEventInput) {
  return apiFetch<{ id: string; eventType: string; trackedAt: string }>('/track', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      sessionId: body.sessionId ?? getAnalyticsSessionId(),
    }),
    keepalive: true,
  });
}

export function trackAnalyticsEvent(body: AnalyticsTrackEventInput) {
  void sendAnalyticsEvent(body).catch(() => {
    // Tracking must never interrupt product flows.
  });
}

export function useAnalyticsDashboard(days = 30) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [intelligence, setIntelligence] = useState<AnalyticsIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, insightsData, intelligenceData] = await Promise.all([
        apiFetch<AnalyticsDashboardResponse>(`/dashboard?days=${days}`),
        apiFetch<AnalyticsInsight[]>(`/recommendations?days=${days}`),
        apiFetch<AnalyticsIntelligence>(`/intelligence?days=${days}`),
      ]);
      setDashboard(dashboardData);
      setInsights(insightsData);
      setIntelligence(intelligenceData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    dashboard,
    insights,
    intelligence,
    loading,
    error,
    reload: load,
  };
}

export function useAnalyticsTracker() {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = useCallback(async (body: AnalyticsTrackEventInput) => {
    setTracking(true);
    setError(null);
    try {
      return await sendAnalyticsEvent(body);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setTracking(false);
    }
  }, []);

  return { trackEvent, tracking, error };
}