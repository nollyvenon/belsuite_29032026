/**
 * Marketing Engine — Shared Types
 */

export enum AdPlatformEnum {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  GOOGLE_SEARCH = 'GOOGLE_SEARCH',
  GOOGLE_DISPLAY = 'GOOGLE_DISPLAY',
  GOOGLE_YOUTUBE = 'GOOGLE_YOUTUBE',
  TIKTOK_ADS = 'TIKTOK_ADS',
  LINKEDIN_ADS = 'LINKEDIN_ADS',
  TWITTER_ADS = 'TWITTER_ADS',
}

export enum CampaignObjectiveEnum {
  AWARENESS = 'AWARENESS',
  TRAFFIC = 'TRAFFIC',
  ENGAGEMENT = 'ENGAGEMENT',
  LEADS = 'LEADS',
  CONVERSIONS = 'CONVERSIONS',
  APP_INSTALLS = 'APP_INSTALLS',
  VIDEO_VIEWS = 'VIDEO_VIEWS',
}

export enum AdFormatEnum {
  SINGLE_IMAGE = 'SINGLE_IMAGE',
  CAROUSEL = 'CAROUSEL',
  VIDEO = 'VIDEO',
  COLLECTION = 'COLLECTION',
  STORY = 'STORY',
  RESPONSIVE_SEARCH = 'RESPONSIVE_SEARCH',
  RESPONSIVE_DISPLAY = 'RESPONSIVE_DISPLAY',
}

export enum ConversionEventTypeEnum {
  PAGE_VIEW = 'PAGE_VIEW',
  CLICK = 'CLICK',
  FORM_SUBMIT = 'FORM_SUBMIT',
  PURCHASE = 'PURCHASE',
  SIGNUP = 'SIGNUP',
  DOWNLOAD = 'DOWNLOAD',
  PHONE_CALL = 'PHONE_CALL',
  VIDEO_PLAY = 'VIDEO_PLAY',
  CUSTOM = 'CUSTOM',
}

// ─── Ad Generation ────────────────────────────────────────────────────────────

export interface AdGenerationRequest {
  businessName: string;
  productOrService: string;
  targetAudience: string;
  objective: CampaignObjectiveEnum;
  platform: AdPlatformEnum;
  format: AdFormatEnum;
  tone?:
    | 'professional'
    | 'casual'
    | 'urgent'
    | 'friendly'
    | 'bold'
    | 'playful';
  brandVoice?: string;
  keyBenefits?: string[];
  competitors?: string[];
  budget?: number;
  variantCount?: number; // 1-5, default 3 (for A/B)
}

export interface AdCreative {
  headline: string;
  body: string;
  callToAction: string;
  aiScore: number;
  rationale: string; // Why AI thinks this will work
}

export interface AdGenerationResult {
  variants: AdCreative[];
  suggestedAudience: AudienceTarget;
  suggestedBudget: BudgetSuggestion;
  platformTips: string[];
}

export interface AudienceTarget {
  ageRange: { min: number; max: number };
  genders: string[];
  interests: string[];
  locations: string[];
  behaviors?: string[];
  lookalikeSeed?: string;
}

export interface BudgetSuggestion {
  daily: number;
  total?: number;
  currency: string;
  reasoning: string;
  expectedImpressions: { min: number; max: number };
  expectedClicks: { min: number; max: number };
  expectedConversions?: { min: number; max: number };
}

// ─── A/B Test ─────────────────────────────────────────────────────────────────

export interface ABTestStatResult {
  variantId: string;
  label: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  cpc: number;
  isControl: boolean;
  relativeUplift: number; // % improvement over control
  confidenceInterval: { lower: number; upper: number };
}

export interface ABTestAnalysis {
  testId: string;
  isSignificant: boolean;
  pValue: number;
  winnerVariantId: string | null;
  variants: ABTestStatResult[];
  recommendation: string;
  sampleSizeRemaining: number;
}

// ─── Budget Optimization ──────────────────────────────────────────────────────

export interface BudgetOptimizationInput {
  campaignId: string;
  totalBudget: number;
  objectives: string[];
  performanceHistory: PerformancePoint[];
  constraints?: { minPerChannel?: Record<string, number> };
}

export interface PerformancePoint {
  date: string;
  platform?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface BudgetAllocation {
  platform?: string;
  adId?: string;
  allocatedBudget: number;
  expectedROAS: number;
  reasoning: string;
}

export interface BudgetOptimizationResult {
  totalBudget: number;
  allocations: BudgetAllocation[];
  projectedRevenue: number;
  projectedROAS: number;
  projectedConversions: number;
  aiInsights: string[];
  warnings: string[];
}

// ─── Performance ──────────────────────────────────────────────────────────────

export interface CampaignSummary {
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
}

export interface DashboardOverview {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  totalImpressions: number;
  avgROAS: number;
  activeCampaigns: number;
  campaigns: CampaignSummary[];
  topAds: TopAd[];
  recentConversions: RecentConversion[];
  spendByPlatform: Record<string, number>;
}

export interface TopAd {
  adId: string;
  adName: string;
  campaignName: string;
  ctr: number;
  cvr: number;
  roas: number;
}

export interface RecentConversion {
  id: string;
  eventType: string;
  value: number | null;
  occurredAt: string;
  utmCampaign: string | null;
}

// ─── Funnel Builder ───────────────────────────────────────────────────────────

export interface FunnelBlock {
  id: string;
  type:
    | 'hero'
    | 'text'
    | 'image'
    | 'video'
    | 'form'
    | 'cta'
    | 'testimonial'
    | 'pricing'
    | 'countdown'
    | 'spacer'
    | 'divider';
  props: Record<string, unknown>;
}

export interface GenerateFunnelRequest {
  businessName: string;
  productOrService: string;
  targetAudience: string;
  objective: 'leads' | 'sales' | 'webinar' | 'app_download' | 'free_trial';
  funnelType: 'squeeze' | 'sales' | 'webinar' | 'tripwire' | 'membership';
  tone?: string;
  pricePoint?: number;
  keyBenefits?: string[];
}
