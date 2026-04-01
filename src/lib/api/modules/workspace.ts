'use client';

import { createApiClient } from '../client';

const analyticsClient = createApiClient('/api/analytics');
const marketingClient = createApiClient('/api/marketing');
const socialClient = createApiClient('/api/social');
const videoClient = createApiClient('/api/video');
const ugcClient = createApiClient('/api/ugc');
const billingClient = createApiClient('/api/v1/billing');

interface AnalyticsDashboardSummary {
  overview: {
    trackedViews: number;
    engagements: number;
    attributedRevenue: number;
    conversions: number;
  };
}

interface MarketingOverviewSummary {
  activeCampaigns: number;
  totalRevenue: number;
  totalSpend: number;
  avgROAS: number;
}

interface SocialAccountSummary {
  id: string;
  platform: string;
}

interface VideoProjectSummary {
  id: string;
  title: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
}

interface UGCDashboardSummary {
  totalProjects: number;
  readyProjects: number;
  rendersInFlight: number;
}

interface BillingOverviewSummary {
  organization: { name: string; tier: string };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    plan?: { name: string; tier: string } | null;
  };
  usage: {
    summary: {
      totalAmount: number;
      currency: string;
    };
  };
}

export interface WorkspaceMetric {
  label: string;
  value: string;
  detail: string;
  accent: 'amber' | 'sky' | 'emerald' | 'violet';
}

export interface WorkspaceModuleCard {
  id: 'analytics' | 'marketing' | 'social' | 'video' | 'ugc' | 'billing' | 'ai' | 'admin';
  title: string;
  href: string;
  description: string;
  metric: string;
  detail: string;
  state: 'live' | 'setup' | 'focus';
  accent: 'amber' | 'sky' | 'emerald' | 'violet';
}

export interface WorkspaceActivityItem {
  id: string;
  title: string;
  summary: string;
}

export interface WorkspaceOverview {
  metrics: WorkspaceMetric[];
  modules: WorkspaceModuleCard[];
  activity: WorkspaceActivityItem[];
}

function currency(value: number, code = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getWorkspaceOverview(days = 30): Promise<WorkspaceOverview> {
  const [analytics, marketing, socialAccounts, videoProjects, ugcDashboard, billing] = await Promise.allSettled([
    analyticsClient.get<AnalyticsDashboardSummary>('/dashboard', { days }),
    marketingClient.get<MarketingOverviewSummary>('/dashboard', { days }),
    socialClient.get<SocialAccountSummary[]>('/accounts'),
    videoClient.get<VideoProjectSummary[]>('/projects'),
    ugcClient.get<UGCDashboardSummary>('/dashboard'),
    billingClient.get<BillingOverviewSummary>('/overview'),
  ]);

  const analyticsData = analytics.status === 'fulfilled' ? analytics.value : null;
  const marketingData = marketing.status === 'fulfilled' ? marketing.value : null;
  const socialData = socialAccounts.status === 'fulfilled' ? socialAccounts.value : [];
  const videoData = videoProjects.status === 'fulfilled' ? videoProjects.value : [];
  const ugcData = ugcDashboard.status === 'fulfilled' ? ugcDashboard.value : null;
  const billingData = billing.status === 'fulfilled' ? billing.value : null;

  const readyVideos = videoData.filter((project) => project.status === 'READY').length;

  return {
    metrics: [
      {
        label: 'Tracked Views',
        value: (analyticsData?.overview.trackedViews ?? 0).toLocaleString(),
        detail: `${(analyticsData?.overview.engagements ?? 0).toLocaleString()} engagements in the selected window`,
        accent: 'sky',
      },
      {
        label: 'Revenue Pulse',
        value: currency(marketingData?.totalRevenue ?? analyticsData?.overview.attributedRevenue ?? 0),
        detail: `${currency(marketingData?.totalSpend ?? 0)} ad spend across active campaigns`,
        accent: 'emerald',
      },
      {
        label: 'Production Queue',
        value: `${readyVideos + (ugcData?.readyProjects ?? 0)}`,
        detail: `${ugcData?.rendersInFlight ?? 0} UGC renders processing right now`,
        accent: 'amber',
      },
      {
        label: 'Billing Runway',
        value: billingData?.subscription.plan?.name ?? billingData?.organization.tier ?? 'Starter',
        detail: `Current period usage ${currency(billingData?.usage.summary.totalAmount ?? 0, billingData?.usage.summary.currency ?? 'USD')}`,
        accent: 'violet',
      },
    ],
    modules: [
      {
        id: 'analytics',
        title: 'Analytics Workspace',
        href: '/analytics',
        description: 'Revenue attribution, event breakdowns, and AI recommendations.',
        metric: (analyticsData?.overview.conversions ?? 0).toLocaleString(),
        detail: 'conversions tracked',
        state: 'focus',
        accent: 'sky',
      },
      {
        id: 'marketing',
        title: 'Marketing Command',
        href: '/marketing',
        description: 'Campaign orchestration, A/B testing, and budget optimization.',
        metric: String(marketingData?.activeCampaigns ?? 0),
        detail: 'active campaigns',
        state: 'live',
        accent: 'amber',
      },
      {
        id: 'social',
        title: 'Social Scheduler',
        href: '/social',
        description: 'Posts, bulk publishing, AI captioning, and retry operations.',
        metric: String(socialData.length),
        detail: 'connected accounts',
        state: socialData.length > 0 ? 'live' : 'setup',
        accent: 'violet',
      },
      {
        id: 'video',
        title: 'Video Studio',
        href: '/video',
        description: 'Scene editing, render queue, asset library, and export flow.',
        metric: String(videoData.length),
        detail: `${readyVideos} ready to export`,
        state: videoData.length > 0 ? 'live' : 'setup',
        accent: 'emerald',
      },
      {
        id: 'ugc',
        title: 'UGC Generator',
        href: '/ugc',
        description: 'Avatars, cloned voices, script generation, and render snapshots.',
        metric: String(ugcData?.totalProjects ?? 0),
        detail: `${ugcData?.readyProjects ?? 0} ready projects`,
        state: ugcData?.totalProjects ? 'live' : 'setup',
        accent: 'amber',
      },
      {
        id: 'billing',
        title: 'Billing Console',
        href: '/billing',
        description: 'Subscriptions, invoices, provider selection, and overage visibility.',
        metric: billingData?.subscription.status ?? 'UNKNOWN',
        detail: billingData?.subscription.plan?.name ?? 'No active plan',
        state: billingData?.subscription.plan ? 'live' : 'setup',
        accent: 'sky',
      },
      {
        id: 'ai',
        title: 'AI Operations',
        href: '/ai/dashboard',
        description: 'Provider monitoring, usage analytics, and generation workflows.',
        metric: (analyticsData?.overview.engagements ?? 0).toLocaleString(),
        detail: 'cross-product AI interactions',
        state: 'live',
        accent: 'violet',
      },
      {
        id: 'admin',
        title: 'Admin Panel',
        href: '/admin',
        description: 'Tenant controls, email provider configuration, and operational health.',
        metric: billingData?.organization.name ?? 'BelSuite',
        detail: 'organization context loaded',
        state: 'live',
        accent: 'emerald',
      },
    ],
    activity: [
      {
        id: 'renewal',
        title: 'Billing horizon',
        summary: billingData?.subscription.currentPeriodEnd
          ? `Next renewal closes on ${new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()}.`
          : 'No renewal date is available yet.',
      },
      {
        id: 'marketing',
        title: 'Campaign pressure',
        summary: `${marketingData?.activeCampaigns ?? 0} active campaigns are contributing ${currency(marketingData?.totalRevenue ?? 0)} in tracked revenue.`,
      },
      {
        id: 'production',
        title: 'Content production',
        summary: `${videoData.length} video projects and ${ugcData?.totalProjects ?? 0} UGC projects are in the current workspace.`,
      },
      {
        id: 'distribution',
        title: 'Distribution footprint',
        summary: `${socialData.length} social account connections are available for scheduling and bulk dispatch.`,
      },
    ],
  };
}