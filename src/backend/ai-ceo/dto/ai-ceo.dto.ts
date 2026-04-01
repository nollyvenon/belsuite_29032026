import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

/**
 * AI CEO DTOs for request/response handling
 */

// Enums for decision types
export enum DecisionType {
  REVENUE_OPTIMIZATION = 'revenue_optimization',
  PRICING_ADJUSTMENT = 'pricing_adjustment',
  FEATURE_RECOMMENDATION = 'feature_recommendation',
  CHURN_MITIGATION = 'churn_mitigation',
  GROWTH_STRATEGY = 'growth_strategy',
}

export enum RecommendationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// Request DTOs
export class GenerateDecisionDto {
  @IsEnum(DecisionType)
  @IsNotEmpty()
  decisionType: DecisionType;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  contextData?: string;
}

export class GenerateReportDto {
  @IsEnum(ReportFrequency)
  @IsNotEmpty()
  frequency: ReportFrequency;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class AnalyzeChurnDto {
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  dayWindow: number = 30;
}

export class OptimizeGrowthDto {
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsEnum(['aggressive', 'moderate', 'conservative'])
  strategy: string = 'moderate';
}

// Response DTOs
export class DecisionResponseDto {
  id: string;
  type: DecisionType;
  severity: RecommendationSeverity;
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
  confidence: number; // 0-100
  aiModel: string;
  generatedAt: Date;
  expiresAt: Date;
}

export class MetricsDto {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  activeSubscriptions: number;
  churned30Days: number;
  topChurnReasons: Array<{ reason: string; count: number }>;
  revenueGrowth: number; // percentage
  conversionRate: number; // percentage
  averageOrderValue: number;
  timestamp: Date;
}

export class ReportResponseDto {
  id: string;
  organizationId: string;
  frequency: ReportFrequency;
  period: {
    start: Date;
    end: Date;
  };
  metrics: MetricsDto;
  decisions: DecisionResponseDto[];
  summary: {
    keyHighlights: string[];
    mainChallenges: string[];
    opportunities: string[];
    recommendations: string[];
  };
  generatedAt: Date;
  nextReportDate: Date;
}

export class AIConfigDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsEnum(['conservative', 'balanced', 'aggressive'])
  riskTolerance: string = 'balanced';

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2)
  growthTarget: number = 1.2; // 20% growth target

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxChurnRateAcceptable: number = 5;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  analysisFrequency: string = 'weekly';
}

export class HealthCheckDto {
  status: 'healthy' | 'degraded' | 'unhealthy';
  aiModelStatus: string;
  dataSourceStatus: string;
  lastAnalysisTime: Date;
  nextScheduledAnalysis: Date;
  errorCount: number;
  successRate: number; // 0-100
}

export class DashboardOverviewDto {
  currentMetrics: MetricsDto;
  activeDecisions: DecisionResponseDto[];
  recentReports: ReportResponseDto[];
  healthCheck: HealthCheckDto;
  trendAnalysis: {
    revenueTrend: Array<{ date: string; value: number }>;
    churnTrend: Array<{ date: string; value: number }>;
    customerGrowthTrend: Array<{ date: string; value: number }>;
  };
}

export class DecisionHistoryDto {
  id: string;
  type: DecisionType;
  severity: RecommendationSeverity;
  title: string;
  implemented: boolean;
  implementedAt?: Date;
  actualImpact?: {
    metric: string;
    projectedValue: number;
    actualValue: number;
    performanceScore: number;
  };
  generatedAt: Date;
}
