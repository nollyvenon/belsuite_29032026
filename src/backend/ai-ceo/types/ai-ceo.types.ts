/**
 * Type definitions for AI CEO metrics and analysis
 */

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  revenueGrowthRate: number;
  revenueGrowthTrend: Array<{ date: string; value: number }>;
  topRevenueDrivers: Array<{ feature: string; contribution: number }>;
}

export interface ChurnMetrics {
  churnRate: number;
  churnTrend: Array<{ date: string; rate: number }>;
  atRiskCustomers: number;
  churnReasons: Map<string, number>;
  customerSegmentChurn: Array<{
    segment: string;
    churnRate: number;
    count: number;
  }>;
  predictedChurn30Days: number;
  predictedChurn90Days: number;
}

export interface PricingMetrics {
  currentTiers: Array<{
    name: string;
    price: number;
    monthlyRecurringRevenue: number;
    subscriberCount: number;
    adoptionRate: number;
  }>;
  priceElasticity: number;
  competitivePosition: string;
  priceOptimizationOpportunity: {
    recommended: number;
    projectedImpact: number;
    confidence: number;
  };
}

export interface FeatureMetrics {
  featureUsage: Array<{
    featureName: string;
    adoptionRate: number;
    engagementScore: number;
    revenueContribution: number;
    userSatisfaction: number;
  }>;
  unusedFeatures: string[];
  highValueFeatures: string[];
  requestedFeatures: Array<{ name: string; requestCount: number }>;
}

export interface GrowthMetrics {
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  paybackPeriod: number;
  marketingROI: number;
  salesCycleLength: number;
  conversionRate: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  retentionRate: number;
}

export interface AIDecision {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  estimatedImpact: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    percentChange: number;
  };
  implementationSteps: string[];
  confidence: number;
  aiModel: string;
  generatedAt: Date;
  expiresAt: Date;
  implemented?: boolean;
  actualImpact?: {
    metric: string;
    actualValue: number;
    percentChange: number;
  };
}

export interface AnalysisContext {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  revenueMetrics: RevenueMetrics;
  churnMetrics: ChurnMetrics;
  pricingMetrics: PricingMetrics;
  featureMetrics: FeatureMetrics;
  growthMetrics: GrowthMetrics;
  historicalDecisions: AIDecision[];
}

export interface DecisionEngine {
  analyze(context: AnalysisContext): Promise<AIDecision>;
  validate(decision: AIDecision): Promise<boolean>;
}

export interface AIAnalysisReport {
  period: { start: Date; end: Date };
  summary: {
    keyHighlights: string[];
    mainChallenges: string[];
    opportunities: string[];
    recommendations: string[];
  };
  decisions: AIDecision[];
  metrics: {
    revenue: RevenueMetrics;
    churn: ChurnMetrics;
    pricing: PricingMetrics;
    features: FeatureMetrics;
    growth: GrowthMetrics;
  };
  generatedAt: Date;
  aiModel: string;
}
