'use client';

import { useState, useCallback, useEffect } from 'react';
import { trackAnalyticsEvent } from '@/hooks/useAnalytics';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type CampaignObjective =
  | 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS'
  | 'CONVERSIONS' | 'APP_INSTALLS' | 'VIDEO_VIEWS';
export type AdPlatform =
  | 'FACEBOOK' | 'INSTAGRAM' | 'GOOGLE_SEARCH' | 'GOOGLE_DISPLAY'
  | 'GOOGLE_YOUTUBE' | 'TIKTOK_ADS' | 'LINKEDIN_ADS' | 'TWITTER_ADS';
export type AdFormat =
  | 'SINGLE_IMAGE' | 'CAROUSEL' | 'VIDEO' | 'COLLECTION'
  | 'STORY' | 'RESPONSIVE_SEARCH' | 'RESPONSIVE_DISPLAY';
export type AdStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'COMPLETED';
export type ABTestStatus = 'DRAFT' | 'RUNNING' | 'CONCLUDED' | 'ARCHIVED';
export type FunnelStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdAccount {
  id: string;
  platform: AdPlatform;
  accountId: string;
  accountName: string;
  currencyCode: string;
  isActive: boolean;
  syncedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  dailyBudget?: number;
  totalBudget?: number;
  spentBudget: number;
  startDate?: string;
  endDate?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  adAccount?: { platform: AdPlatform; accountName: string; currencyCode: string } | null;
  _count?: { ads: number; abTests: number };
}

export interface Ad {
  id: string;
  campaignId: string;
  name: string;
  format: AdFormat;
  status: AdStatus;
  headline?: string;
  body?: string;
  callToAction?: string;
  destinationUrl?: string;
  aiGenerated: boolean;
  aiScore?: number;
  createdAt: string;
  _count?: { variants: number };
}

export interface AdVariant {
  id: string;
  adId: string;
  label: string;
  headline?: string;
  body?: string;
  callToAction?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  isWinner: boolean;
  isControl: boolean;
}

export interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  hypothesis?: string;
  metric: string;
  status: ABTestStatus;
  confidenceLevel: number;
  minimumSampleSize: number;
  trafficSplit: string;
  winnerVariantId?: string;
  pValue?: number;
  conclusionNotes?: string;
  startedAt?: string;
  concludedAt?: string;
  createdAt: string;
  variants: AdVariant[];
}

export interface ABTestAnalysis {
  testId: string;
  isSignificant: boolean;
  pValue: number;
  winnerVariantId: string | null;
  variants: Array<{
    variantId: string;
    label: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    cpc: number;
    isControl: boolean;
    relativeUplift: number;
    confidenceInterval: { lower: number; upper: number };
  }>;
  recommendation: string;
  sampleSizeRemaining: number;
}

export interface AdCreative {
  headline: string;
  body: string;
  callToAction: string;
  aiScore: number;
  rationale: string;
}

export interface AdGenerationResult {
  variants: AdCreative[];
  suggestedAudience: {
    ageRange: { min: number; max: number };
    genders: string[];
    interests: string[];
    locations: string[];
    behaviors?: string[];
  };
  suggestedBudget: {
    daily: number;
    total?: number;
    currency: string;
    reasoning: string;
    expectedImpressions: { min: number; max: number };
    expectedClicks: { min: number; max: number };
    expectedConversions?: { min: number; max: number };
  };
  platformTips: string[];
}

export interface BudgetOptimizationResult {
  totalBudget: number;
  allocations: Array<{
    adId?: string;
    allocatedBudget: number;
    expectedROAS: number;
    reasoning: string;
  }>;
  projectedRevenue: number;
  projectedROAS: number;
  projectedConversions: number;
  aiInsights: string[];
  warnings: string[];
}

export interface DashboardOverview {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  totalImpressions: number;
  avgROAS: number;
  activeCampaigns: number;
  campaigns: Array<{
    campaignId: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
    trend: 'up' | 'down' | 'stable';
    trendPct: number;
  }>;
  topAds: Array<{
    adId: string;
    adName: string;
    campaignName: string;
    ctr: number;
    cvr: number;
    roas: number;
  }>;
  recentConversions: Array<{
    id: string;
    eventType: string;
    value: number | null;
    occurredAt: string;
    utmCampaign: string | null;
  }>;
  spendByPlatform: Record<string, number>;
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  status: FunnelStatus;
  slug: string;
  domain?: string;
  aiGenerated: boolean;
  publishedAt?: string;
  createdAt: string;
  _count?: { pages: number };
  pages?: Array<{
    id: string;
    title: string;
    views: number;
    conversions: number;
    order: number;
  }>;
}

export interface FunnelPage {
  id: string;
  funnelId: string;
  order: number;
  pageType: string;
  title: string;
  slug: string;
  blocksJson?: string;
  ctaText?: string;
  ctaUrl?: string;
  views: number;
  conversions: number;
  aiGenerated: boolean;
}

// ── API helper ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/marketing${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Dashboard hook ────────────────────────────────────────────────────────────

export function useMarketingDashboard(days = 30) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DashboardOverview>(`/dashboard?days=${days}`);
      setOverview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  return { overview, loading, error, reload: load };
}

// ── Campaigns hook ────────────────────────────────────────────────────────────

export function useCampaigns(status?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? `?status=${status}` : '';
      const data = await apiFetch<Campaign[]>(`/campaigns${params}`);
      setCampaigns(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const createCampaign = useCallback(
    async (dto: {
      name: string;
      objective: CampaignObjective;
      dailyBudget?: number;
      totalBudget?: number;
      description?: string;
    }) => {
      const c = await apiFetch<Campaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      trackAnalyticsEvent({
        eventType: 'marketing_campaign_created',
        entityType: 'MARKETING_CAMPAIGN',
        entityId: c.id,
        channel: 'MARKETING',
        source: 'APP',
        value: dto.dailyBudget ?? dto.totalBudget,
        properties: {
          objective: dto.objective,
          dailyBudget: dto.dailyBudget,
          totalBudget: dto.totalBudget,
        },
      });
      await load();
      return c;
    },
    [load],
  );

  const setStatus = useCallback(
    async (id: string, s: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
      await apiFetch(`/campaigns/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: s }),
      });
      trackAnalyticsEvent({
        eventType: 'marketing_campaign_status_changed',
        entityType: 'MARKETING_CAMPAIGN',
        entityId: id,
        channel: 'MARKETING',
        source: 'APP',
        properties: { status: s },
      });
      await load();
    },
    [load],
  );

  const deleteCampaign = useCallback(
    async (id: string) => {
      await apiFetch(`/campaigns/${id}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return { campaigns, loading, error, reload: load, createCampaign, setStatus, deleteCampaign };
}

// ── Ad Generation hook ────────────────────────────────────────────────────────

export function useAdGenerator() {
  const [result, setResult] = useState<AdGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      businessName: string;
      productOrService: string;
      targetAudience: string;
      objective: CampaignObjective;
      platform: AdPlatform;
      format: AdFormat;
      tone?: string;
      keyBenefits?: string[];
      budget?: number;
      variantCount?: number;
    }) => {
      setGenerating(true);
      setError(null);
      try {
        const data = await apiFetch<AdGenerationResult>('/ai/generate-ads', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        setResult(data);
        trackAnalyticsEvent({
          eventType: 'marketing_ads_generated',
          entityType: 'MARKETING_AD_BATCH',
          entityId: params.platform,
          channel: 'MARKETING',
          source: 'APP',
          value: data.variants.length,
          properties: {
            objective: params.objective,
            platform: params.platform,
            format: params.format,
            requestedVariants: params.variantCount,
            generatedVariants: data.variants.length,
          },
        });
        return data;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [],
  );

  const saveToCamera = useCallback(
    async (campaignId: string, genResult: AdGenerationResult, request: any) => {
      const saved = await apiFetch<{ adIds: string[] }>(`/campaigns/${campaignId}/ai/save-ads`, {
        method: 'POST',
        body: JSON.stringify({ result: genResult, request }),
      });
      trackAnalyticsEvent({
        eventType: 'marketing_ads_saved',
        entityType: 'MARKETING_CAMPAIGN',
        entityId: campaignId,
        channel: 'MARKETING',
        source: 'APP',
        value: saved.adIds.length,
        properties: {
          adCount: saved.adIds.length,
        },
      });
      return saved;
    },
    [],
  );

  const reset = useCallback(() => setResult(null), []);

  return { result, generating, error, generate, saveToCamera, reset };
}

// ── A/B Test hook ─────────────────────────────────────────────────────────────

export function useABTests(campaignId: string) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ABTest[]>(`/campaigns/${campaignId}/ab-tests`);
      setTests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const getAnalysis = useCallback(async (testId: string) => {
    return apiFetch<ABTestAnalysis>(`/ab-tests/${testId}/analysis`);
  }, []);

  const createTest = useCallback(
    async (dto: {
      name: string;
      metric: string;
      trafficSplit: number;
      variants: { name: string; headline?: string; body?: string; cta?: string }[];
    }) => {
      const t = await apiFetch<ABTest>(`/campaigns/${campaignId}/ab-tests`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await load();
      return t;
    },
    [campaignId, load],
  );

  const startTest = useCallback(
    async (testId: string) => {
      await apiFetch(`/ab-tests/${testId}/start`, { method: 'POST' });
      await load();
    },
    [load],
  );

  const deleteTest = useCallback(
    async (testId: string) => {
      await apiFetch(`/ab-tests/${testId}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return { tests, loading, reload: load, createTest, startTest, getAnalysis, deleteTest };
}

// ── Budget Optimizer hook ─────────────────────────────────────────────────────

export function useBudgetOptimizer() {
  const [result, setResult] = useState<BudgetOptimizationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (campaignId: string, totalBudget?: number) => {
    setRunning(true);
    setError(null);
    try {
      const data = await apiFetch<BudgetOptimizationResult>(
        `/campaigns/${campaignId}/optimize-budget`,
        { method: 'POST', body: JSON.stringify({ totalBudget }) },
      );
      setResult(data);
      trackAnalyticsEvent({
        eventType: 'marketing_budget_optimized',
        entityType: 'MARKETING_CAMPAIGN',
        entityId: campaignId,
        channel: 'MARKETING',
        source: 'APP',
        value: totalBudget,
        properties: {
          allocationCount: data.allocations.length,
          projectedRevenue: data.projectedRevenue,
          projectedROAS: data.projectedROAS,
        },
      });
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  const apply = useCallback(
    async (campaignId: string, r: BudgetOptimizationResult) => {
      const applied = await apiFetch(`/campaigns/${campaignId}/apply-optimization`, {
        method: 'POST',
        body: JSON.stringify({ result: r }),
      });
      trackAnalyticsEvent({
        eventType: 'marketing_budget_applied',
        entityType: 'MARKETING_CAMPAIGN',
        entityId: campaignId,
        channel: 'MARKETING',
        source: 'APP',
        value: r.totalBudget,
        properties: {
          allocationCount: r.allocations.length,
          projectedROAS: r.projectedROAS,
        },
      });
      return applied;
    },
    [],
  );

  const portfolioRecommendations = useCallback(async () => {
    return apiFetch('/portfolio/recommendations');
  }, []);

  return { result, running, error, optimize, apply, portfolioRecommendations };
}

// ── Funnels hook ──────────────────────────────────────────────────────────────

export function useFunnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Funnel[]>('/funnels');
      setFunnels(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createFunnel = useCallback(
    async (data: { name: string; slug: string; description?: string }) => {
      const f = await apiFetch<Funnel>('/funnels', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      trackAnalyticsEvent({
        eventType: 'marketing_funnel_created',
        entityType: 'MARKETING_FUNNEL',
        entityId: f.id,
        channel: 'MARKETING',
        source: 'APP',
        properties: {
          slug: data.slug,
        },
      });
      await load();
      return f;
    },
    [load],
  );

  const generateFunnel = useCallback(
    async (params: {
      businessName: string;
      productOrService: string;
      targetAudience: string;
      objective: string;
      funnelType: string;
      tone?: string;
      pricePoint?: number;
      keyBenefits?: string[];
    }) => {
      const result = await apiFetch<{ funnelId: string; slug: string; pages: number }>(
        '/ai/generate-funnel',
        { method: 'POST', body: JSON.stringify(params) },
      );
      trackAnalyticsEvent({
        eventType: 'marketing_funnel_generated',
        entityType: 'MARKETING_FUNNEL',
        entityId: result.funnelId,
        channel: 'MARKETING',
        source: 'APP',
        value: result.pages,
        properties: {
          objective: params.objective,
          funnelType: params.funnelType,
          tone: params.tone,
          slug: result.slug,
        },
      });
      await load();
      return result;
    },
    [load],
  );

  const publishFunnel = useCallback(
    async (id: string) => {
      await apiFetch(`/funnels/${id}/publish`, { method: 'POST' });
      trackAnalyticsEvent({
        eventType: 'marketing_funnel_published',
        entityType: 'MARKETING_FUNNEL',
        entityId: id,
        channel: 'MARKETING',
        source: 'APP',
      });
      await load();
    },
    [load],
  );

  const unpublishFunnel = useCallback(
    async (id: string) => {
      await apiFetch(`/funnels/${id}/unpublish`, { method: 'POST' });
      trackAnalyticsEvent({
        eventType: 'marketing_funnel_unpublished',
        entityType: 'MARKETING_FUNNEL',
        entityId: id,
        channel: 'MARKETING',
        source: 'APP',
      });
      await load();
    },
    [load],
  );

  const deleteFunnel = useCallback(
    async (id: string) => {
      await apiFetch(`/funnels/${id}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return { funnels, loading, error, reload: load, createFunnel, generateFunnel, publishFunnel, unpublishFunnel, deleteFunnel };
}

// ── Ad Platform Connections hook ──────────────────────────────────────────────

export function useAdConnections() {
  const [fbAccounts, setFbAccounts] = useState<AdAccount[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fb, google] = await Promise.all([
        apiFetch<AdAccount[]>('/connections/facebook/accounts'),
        apiFetch<AdAccount[]>('/connections/google/accounts'),
      ]);
      setFbAccounts(fb);
      setGoogleAccounts(google);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getOAuthUrl = useCallback(async (platform: 'facebook' | 'google') => {
    const redirectUri = `${window.location.origin}/oauth-callback?platform=${platform}&type=ads`;
    try {
      const { url } = await apiFetch<{ url: string }>(
        `/connections/${platform}/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
      );
      return url;
    } catch {
      return null;
    }
  }, []);

  const refreshAccounts = useCallback(async (platform: 'facebook' | 'google') => {
    try {
      if (platform === 'facebook') {
        const fb = await apiFetch<AdAccount[]>('/connections/facebook/accounts');
        setFbAccounts(fb);
      } else {
        const google = await apiFetch<AdAccount[]>('/connections/google/accounts');
        setGoogleAccounts(google);
      }
    } catch {
      // ignore
    }
  }, []);

  const connectFacebook = useCallback(async (redirectUri: string) => {
    const { url } = await apiFetch<{ url: string }>(
      `/connections/facebook/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
    window.location.href = url;
  }, []);

  const connectGoogle = useCallback(async (redirectUri: string) => {
    const { url } = await apiFetch<{ url: string }>(
      `/connections/google/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
    window.location.href = url;
  }, []);

  return { fbAccounts, googleAccounts, loading, reload: load, getOAuthUrl, refreshAccounts, connectFacebook, connectGoogle };
}
