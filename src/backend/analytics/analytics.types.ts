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

export interface AnalyticsModuleMetric {
  module: 'CONTENT' | 'SOCIAL' | 'VIDEO' | 'MARKETING' | 'PAYMENTS';
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
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
  publishedAt: Date | null;
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