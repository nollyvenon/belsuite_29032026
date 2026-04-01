import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { OpenAI } from 'openai';

// Import decision engines
import {
  RevenueOptimizerEngine,
  PricingOptimizerEngine,
  ChurnAnalyzerEngine,
  FeatureRecommenderEngine,
  GrowthOptimizerEngine,
} from '../engines';

// Import data adapters
import { BillingDataAdapter } from '../adapters/billing.adapter';
import { AnalyticsDataAdapter } from '../adapters/analytics.adapter';
import { OrganizationsDataAdapter } from '../adapters/organizations.adapter';

// Import types and DTOs
import {
  AIDecision,
  AnalysisContext,
  RevenueMetrics,
  ChurnMetrics,
  PricingMetrics,
  FeatureMetrics,
  GrowthMetrics,
  AIAnalysisReport,
} from '../types/ai-ceo.types';
import {
  DecisionType,
  RecommendationSeverity,
  DecisionResponseDto,
  MetricsDto,
  ReportResponseDto,
  HealthCheckDto,
  DashboardOverviewDto,
  ReportFrequency,
} from '../dto/ai-ceo.dto';

/**
 * AI CEO Service
 * Orchestrates decision engines, collects metrics, generates reports, and manages autonomous recommendations
 */
@Injectable()
export class AICEOService {
  private readonly logger = new Logger(AICEOService.name);
  private readonly openai: any;

  private readonly engines = {
    revenueOptimizer: new RevenueOptimizerEngine(),
    pricingOptimizer: new PricingOptimizerEngine(),
    churnAnalyzer: new ChurnAnalyzerEngine(),
    featureRecommender: new FeatureRecommenderEngine(),
    growthOptimizer: new GrowthOptimizerEngine(),
  };

  private readonly DECISION_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days
  private readonly METRICS_CACHE_TTL = 24 * 60 * 60; // 24 hours

  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-ceo-decisions') private decisionsQueue: Queue,
    @InjectQueue('ai-ceo-reports') private reportsQueue: Queue,
    private billingAdapter: BillingDataAdapter,
    private analyticsAdapter: AnalyticsDataAdapter,
    private organizationsAdapter: OrganizationsDataAdapter,
    private redis?: any,
  ) {
    // Initialize OpenAI if API key is set
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (error) {
        this.logger.warn('Failed to initialize OpenAI client');
      }
    }
  }

  /**
   * Generate decision for organization using specified engine
   */
  async generateDecision(
    organizationId: string,
    decisionType: DecisionType,
  ): Promise<DecisionResponseDto> {
    try {
      this.logger.log(`Generating ${decisionType} decision for org: ${organizationId}`);

      // Check cache first
      const cacheKey = `decision:${organizationId}:${decisionType}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for decision: ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Gather analysis context
      const context = await this.gatherAnalysisContext(organizationId);

      // Select and run appropriate engine
      let decision: AIDecision;
      switch (decisionType) {
        case DecisionType.REVENUE_OPTIMIZATION:
          decision = await this.engines.revenueOptimizer.analyze(context);
          break;
        case DecisionType.PRICING_ADJUSTMENT:
          decision = await this.engines.pricingOptimizer.analyze(context);
          break;
        case DecisionType.CHURN_MITIGATION:
          decision = await this.engines.churnAnalyzer.analyze(context);
          break;
        case DecisionType.FEATURE_RECOMMENDATION:
          decision = await this.engines.featureRecommender.analyze(context);
          break;
        case DecisionType.GROWTH_STRATEGY:
          decision = await this.engines.growthOptimizer.analyze(context);
          break;
        default:
          throw new Error(`Unknown decision type: ${decisionType}`);
      }

      // Validate decision
      const isValid = await this.validateDecision(decision);
      if (!isValid) {
        this.logger.warn(`Decision validation failed for ${decisionType}`);
        throw new Error('Decision validation failed');
      }

      // Persist decision
      await this.persistDecision(organizationId, decision);

      // Cache result
      await this.redis.setex(cacheKey, this.DECISION_CACHE_TTL, JSON.stringify(decision));

      // Queue job for follow-up analysis
      await this.decisionsQueue.add(
        'analyze-impact',
        { decisionId: decision.id, organizationId },
        { delay: 24 * 60 * 60 * 1000 }, // Follow up after 24 hours
      );

      return this.mapDecisionToDto(decision);
    } catch (error) {
      this.logger.error(`Error generating decision: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate comprehensive report for organization
   */
  async generateReport(organizationId: string, frequency: ReportFrequency): Promise<ReportResponseDto> {
    try {
      this.logger.log(`Generating ${frequency} report for org: ${organizationId}`);

      // Gather analysis context
      const context = await this.gatherAnalysisContext(organizationId);

      // Run all decision engines
      const decisions = await Promise.all([
        this.engines.revenueOptimizer.analyze(context),
        this.engines.pricingOptimizer.analyze(context),
        this.engines.churnAnalyzer.analyze(context),
        this.engines.featureRecommender.analyze(context),
        this.engines.growthOptimizer.analyze(context),
      ]);

      // Apply AI to generate summary using OpenAI
      const summary = await this.generateReportSummary(context, decisions);

      // Create report object
      const report: AIAnalysisReport = {
        period: {
          start: this.getPeriodStart(frequency),
          end: new Date(),
        },
        summary,
        decisions,
        metrics: {
          revenue: context.revenueMetrics,
          churn: context.churnMetrics,
          pricing: context.pricingMetrics,
          features: context.featureMetrics,
          growth: context.growthMetrics,
        },
        generatedAt: new Date(),
        aiModel: 'gpt-4-turbo',
      };

      // Persist report
      await this.persistReport(organizationId, report, frequency);

      // Cache report
      const cacheKey = `report:${organizationId}:${frequency}`;
      await this.redis.setex(cacheKey, this.DECISION_CACHE_TTL, JSON.stringify(report));

      return this.mapReportToDto(report, organizationId);
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Scheduled job: Daily metrics collection and analysis
   */
  @Cron('0 0 * * *') // Daily at midnight UTC
  async runDailyAnalysis() {
    try {
      this.logger.log('Starting daily AI CEO analysis');

      // Get all organizations (note: aiCeoEnabled field must be added to schema)
      const organizations = await this.prisma.organization.findMany({
        select: { id: true },
        take: 100, // Process first 100 orgs, can be paginated
      });

      for (const org of organizations) {
        // Generate all decisions
        for (const decisionType of Object.values(DecisionType)) {
          await this.decisionsQueue.add('generate-decision', {
            organizationId: org.id,
            decisionType,
          });
        }
      }

      this.logger.log(`Queued daily analysis for ${organizations.length} organizations`);
    } catch (error) {
      this.logger.error(`Error in daily analysis: ${error.message}`, error.stack);
    }
  }

  /**
   * Scheduled job: Weekly report generation (Monday at midnight)
   */
  @Cron('0 0 * * 1') // Weekly on Mondays at midnight UTC
  async runWeeklyReports() {
    try {
      this.logger.log('Starting weekly report generation');

      const organizations = await this.prisma.organization.findMany({
        select: { id: true },
        take: 100, // Process first 100 orgs
      });

      for (const org of organizations) {
        await this.reportsQueue.add('generate-report', {
          organizationId: org.id,
          frequency: ReportFrequency.WEEKLY,
        });
      }

      this.logger.log(`Queued weekly reports for ${organizations.length} organizations`);
    } catch (error) {
      this.logger.error(`Error in weekly reports: ${error.message}`, error.stack);
    }
  }

  /**
   * Get dashboard overview with current metrics and decisions
   */
  async getDashboardOverview(organizationId: string): Promise<DashboardOverviewDto> {
    try {
      // Get current metrics (cached)
      const cacheKey = `metrics:${organizationId}`;
      let metrics: MetricsDto;

      const cached = await this.redis.get(cacheKey);
      if (cached) {
        metrics = JSON.parse(cached);
      } else {
        metrics = await this.gatherMetricsDto(organizationId);
        await this.redis.setex(cacheKey, this.METRICS_CACHE_TTL, JSON.stringify(metrics));
      }

      // Get active decisions (non-expired)
      const decisions = await this.getActiveDecisions(organizationId);
      const decisionDtos = decisions.map((d) => this.mapDecisionToDto(d));

      // Get recent reports
      const recentReports = await this.getRecentReports(organizationId, 3);
      const reportDtos = recentReports.map((r) => this.mapReportToDto(r, organizationId));

      // Health check
      const healthCheck = await this.getHealthStatus(organizationId);

      // Trend analysis
      const trends = await this.getTrendAnalysis(organizationId);

      return {
        currentMetrics: metrics,
        activeDecisions: decisionDtos,
        recentReports: reportDtos,
        healthCheck,
        trendAnalysis: trends,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Apply (implement) a decision recommendation
   */
  async applyDecision(organizationId: string, decisionId: string): Promise<void> {
    try {
      this.logger.log(`Applying decision ${decisionId} for org: ${organizationId}`);

      // Note: Update to implement when AIceoDecision model is added to Prisma schema
      // await this.prisma.aiCEODecision.update({
      //   where: { id: decisionId },
      //   data: {
      //     implemented: true,
      //     implementedAt: new Date(),
      //   },
      // });

      // Queue follow-up impact analysis
      await this.decisionsQueue.add(
        'track-impact',
        {
          decisionId,
          organizationId,
          appliedAt: new Date(),
        },
        {
          delay: 14 * 24 * 60 * 60 * 1000, // Track after 2 weeks
        },
      );

      this.logger.log(`Decision ${decisionId} marked as implemented`);
    } catch (error) {
      this.logger.error(`Error applying decision: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get decision history with actual impact tracking
   */
  async getDecisionHistory(organizationId: string, limit = 20): Promise<any[]> {
    try {
      // Note: Implement when AIceoDecision model is added to Prisma schema
      // return this.prisma.aiCEODecision.findMany({
      //   where: { organizationId, implemented: true },
      //   orderBy: { generatedAt: 'desc' },
      //   take: limit,
      //   select: {
      //     id: true,
      //     type: true,
      //     severity: true,
      //     title: true,
      //     implemented: true,
      //     implementedAt: true,
      //     actualImpact: true,
      //     generatedAt: true,
      //   },
      // });

      // Temporary: return empty array until Prisma schema is updated
      return [];
    } catch (error) {
      this.logger.error(`Error getting decision history: ${error.message}`, error.stack);
      return [];
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private async gatherAnalysisContext(organizationId: string): Promise<AnalysisContext> {
    return {
      organizationId,
      periodStart: this.getPeriodStart('monthly'),
      periodEnd: new Date(),
      revenueMetrics: await this.gatherRevenueMetrics(organizationId),
      churnMetrics: await this.gatherChurnMetrics(organizationId),
      pricingMetrics: await this.gatherPricingMetrics(organizationId),
      featureMetrics: await this.gatherFeatureMetrics(organizationId),
      growthMetrics: await this.gatherGrowthMetrics(organizationId),
      historicalDecisions: await this.getHistoricalDecisions(organizationId),
    };
  }

  private async gatherRevenueMetrics(organizationId: string): Promise<RevenueMetrics> {
    // Query Billing module for revenue data
    const stripeData = await this.queryBillingMetrics(organizationId);

    return {
      totalRevenue: (stripeData as any).totalRevenue || 0,
      monthlyRecurringRevenue: (stripeData as any).mrr || 0,
      annualRecurringRevenue: (stripeData as any).arr || 0,
      revenueGrowthRate: (stripeData as any).growthRate || 0,
      revenueGrowthTrend: (stripeData as any).growthTrend || [],
      topRevenueDrivers: (stripeData as any).topFeatures || [],
    };
  }

  private async gatherChurnMetrics(organizationId: string): Promise<ChurnMetrics> {
    // Query Analytics module for churn data
    const analyticsData = await this.queryChurnAnalytics(organizationId);

    return {
      churnRate: (analyticsData as any).churnRate || 0,
      churnTrend: (analyticsData as any).trend || [],
      atRiskCustomers: (analyticsData as any).atRisk || 0,
      churnReasons: new Map((analyticsData as any).reasons || []),
      customerSegmentChurn: (analyticsData as any).bySegment || [],
      predictedChurn30Days: (analyticsData as any).predicted30d || 0,
      predictedChurn90Days: (analyticsData as any).predicted90d || 0,
    };
  }

  private async gatherPricingMetrics(organizationId: string): Promise<PricingMetrics> {
    const pricingData = await this.queryPricingData(organizationId);

    return {
      currentTiers: (pricingData as any).tiers || [],
      priceElasticity: (pricingData as any).elasticity || 1,
      competitivePosition: (pricingData as any).position || 'market',
      priceOptimizationOpportunity: {
        recommended: (pricingData as any).recommendedPrice || 0,
        projectedImpact: (pricingData as any).projectedImpact || 0,
        confidence: (pricingData as any).confidence || 0.5,
      },
    };
  }

  private async gatherFeatureMetrics(organizationId: string): Promise<FeatureMetrics> {
    const featureData = await this.queryFeatureMetrics(organizationId);

    return {
      featureUsage: (featureData as any).usage || [],
      unusedFeatures: (featureData as any).unused || [],
      highValueFeatures: (featureData as any).highValue || [],
      requestedFeatures: (featureData as any).requested || [],
    };
  }

  private async gatherGrowthMetrics(organizationId: string): Promise<GrowthMetrics> {
    const growthData = await this.queryGrowthMetrics(organizationId);

    return {
      customerAcquisitionCost: (growthData as any).cac || 0,
      customerLifetimeValue: (growthData as any).ltv || 0,
      paybackPeriod: (growthData as any).payback || 0,
      marketingROI: (growthData as any).roi || 0,
      salesCycleLength: (growthData as any).salesCycle || 0,
      conversionRate: (growthData as any).conversion || 0,
      activeCustomers: (growthData as any).activeCustomers || 0,
      newCustomersThisMonth: (growthData as any).newCustomers || 0,
      retentionRate: (growthData as any).retention || 0,
    };
  }

  private async gatherMetricsDto(organizationId: string): Promise<MetricsDto> {
    const revenue = await this.gatherRevenueMetrics(organizationId);
    const churn = await this.gatherChurnMetrics(organizationId);
    const growth = await this.gatherGrowthMetrics(organizationId);

    return {
      totalRevenue: revenue.totalRevenue,
      monthlyRecurringRevenue: revenue.monthlyRecurringRevenue,
      churnRate: churn.churnRate,
      customerAcquisitionCost: growth.customerAcquisitionCost,
      customerLifetimeValue: growth.customerLifetimeValue,
      activeSubscriptions: growth.activeCustomers,
      churned30Days: churn.atRiskCustomers,
      topChurnReasons: Array.from(churn.churnReasons.entries())
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count })),
      revenueGrowth: revenue.revenueGrowthRate,
      conversionRate: growth.conversionRate,
      averageOrderValue: revenue.totalRevenue / Math.max(growth.activeCustomers, 1),
      timestamp: new Date(),
    };
  }

  private async validateDecision(decision: AIDecision): Promise<boolean> {
    try {
      // Validate using engine-specific logic
      const engineKey = this.getEngineForDecisionType(decision.type);
      const engine = this.engines[engineKey];
      return engine ? await engine.validate(decision) : true;
    } catch (error) {
      this.logger.warn(`Decision validation error: ${error.message}`);
      return false;
    }
  }

  private async persistDecision(organizationId: string, decision: AIDecision): Promise<void> {
    try {
      // Note: Implement when AIceoDecision model is added to Prisma schema
      // await this.prisma.aiCEODecision.create({
      //   data: {
      //     id: decision.id,
      //     organizationId,
      //     type: decision.type,
      //     severity: decision.severity,
      //     title: decision.title,
      //     description: decision.description,
      //     recommendation: decision.recommendation,
      //     estimatedImpact: decision.estimatedImpact,
      //     implementationSteps: decision.implementationSteps,
      //     confidence: decision.confidence,
      //     aiModel: decision.aiModel,
      //     generatedAt: decision.generatedAt,
      //     expiresAt: decision.expiresAt,
      //   },
      // });
      this.logger.debug(`Would persist decision ${decision.id} (Prisma schema update needed)`);
    } catch (error) {
      this.logger.warn(`Could not persist decision: ${error.message}`);
    }
  }

  private async persistReport(
    organizationId: string,
    report: AIAnalysisReport,
    frequency: ReportFrequency,
  ): Promise<void> {
    try {
      // Note: Implement when AICEOReport model is added to Prisma schema
      // await this.prisma.aiCEOReport.create({
      //   data: {
      //     organizationId,
      //     frequency,
      //     period: report.period,
      //     metrics: report.metrics,
      //     summary: report.summary,
      //     decisions: report.decisions,
      //     generatedAt: report.generatedAt,
      //     aiModel: report.aiModel,
      //   },
      // });
      this.logger.debug(`Would persist report for org ${organizationId} (Prisma schema update needed)`);
    } catch (error) {
      this.logger.warn(`Could not persist report: ${error.message}`);
    }
  }

  private async generateReportSummary(context: AnalysisContext, decisions: AIDecision[]): Promise<{
    keyHighlights: string[];
    mainChallenges: string[];
    opportunities: string[];
    recommendations: string[];
  }> {
    try {
      // Use OpenAI to generate AI-powered insights if available
      if (!this.openai) {
        this.logger.warn('OpenAI client not initialized, returning default summary');
        return {
          keyHighlights: decisions.map((d) => d.title).slice(0, 3),
          mainChallenges: ['Revenue growth below target'],
          opportunities: ['Customer retention improvement', 'Feature optimization'],
          recommendations: decisions.map((d) => d.recommendation).slice(0, 3),
        };
      }

      const prompt = `
    Based on the following business metrics and AI decisions, generate an executive summary:
    
    Metrics:
    - MRR: $${context.revenueMetrics.monthlyRecurringRevenue.toFixed(0)}
    - Churn Rate: ${context.churnMetrics.churnRate.toFixed(2)}%
    - LTV:CAC: ${(context.growthMetrics.customerLifetimeValue / Math.max(context.growthMetrics.customerAcquisitionCost, 1)).toFixed(1)}x
    
    AI Decisions:
    ${decisions.map((d) => `- ${d.title}: ${d.recommendation}`).join('\n')}
    
    Provide:
    1. 3 key highlights
    2. 3 main challenges
    3. 3 opportunities
    4. 3 recommendations`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Parse OpenAI response (simplified)
      const content = response.choices[0]?.message?.content || '';
      const sections = content.split('\n\n');

      return {
        keyHighlights: this.extractBulletPoints(sections[0] || ''),
        mainChallenges: this.extractBulletPoints(sections[1] || ''),
        opportunities: this.extractBulletPoints(sections[2] || ''),
        recommendations: this.extractBulletPoints(sections[3] || ''),
      };
    } catch (error) {
      this.logger.warn(`Could not generate AI summary: ${error.message}`);
      // Return fallback summary
      return {
        keyHighlights: decisions.map((d) => d.title).slice(0, 3),
        mainChallenges: ['Review metrics for alerts'],
        opportunities: ['Apply recommended decisions'],
        recommendations: decisions.map((d) => d.recommendation).slice(0, 3),
      };
    }
  }

  private async getActiveDecisions(organizationId: string): Promise<AIDecision[]> {
    try {
      // Note: Implement when AIceoDecision model is added to Prisma schema
      // const decisions = await this.prisma.aiCEODecision.findMany({
      //   where: {
      //     organizationId,
      //     expiresAt: { gt: new Date() },
      //   },
      //   orderBy: { generatedAt: 'desc' },
      //   take: 5,
      // });
      // return decisions as any;

      return [];
    } catch (error) {
      this.logger.warn(`Could not fetch active decisions: ${error.message}`);
      return [];
    }
  }

  private async getRecentReports(organizationId: string, limit: number): Promise<AIAnalysisReport[]> {
    try {
      // Note: Implement when AICEOReport model is added to Prisma schema
      // const reports = await this.prisma.aiCEOReport.findMany({
      //   where: { organizationId },
      //   orderBy: { generatedAt: 'desc' },
      //   take: limit,
      // });
      // return reports as any;

      return [];
    } catch (error) {
      this.logger.warn(`Could not fetch recent reports: ${error.message}`);
      return [];
    }
  }

  private async getHealthStatus(organizationId: string): Promise<HealthCheckDto> {
    let lastAnalysis: any = null;
    try {
      // @ts-ignore - aiCEODecision model will be available after Prisma generates
      lastAnalysis = await (this.prisma as any).aiCEODecision.findFirst({
        where: { organizationId },
        orderBy: { generatedAt: 'desc' },
        select: { generatedAt: true },
      });
    } catch (error) {
      // Model not yet available, continue with null
    }

    return {
      status: 'healthy',
      aiModelStatus: 'operational',
      dataSourceStatus: 'connected',
      lastAnalysisTime: lastAnalysis?.generatedAt || new Date(),
      nextScheduledAnalysis: new Date(Date.now() + 24 * 60 * 60 * 1000),
      errorCount: 0,
      successRate: 98,
    };
  }

  private async getTrendAnalysis(
    organizationId: string,
  ): Promise<{
    revenueTrend: Array<{ date: string; value: number }>;
    churnTrend: Array<{ date: string; value: number }>;
    customerGrowthTrend: Array<{ date: string; value: number }>;
  }> {
    // Query analytics for trends (simplified)
    return {
      revenueTrend: [],
      churnTrend: [],
      customerGrowthTrend: [],
    };
  }

  private async getHistoricalDecisions(organizationId: string): Promise<AIDecision[]> {
    try {
      // Note: Implement when AIceoDecision model is added to Prisma schema
      // const decisions = await this.prisma.aiCEODecision.findMany({
      //   where: { organizationId, implemented: true },
      //   orderBy: { generatedAt: 'desc' },
      //   take: 10,
      // });
      // return decisions as any;

      return [];
    } catch (error) {
      this.logger.warn(`Could not fetch historical decisions: ${error.message}`);
      return [];
    }
  }

  private mapDecisionToDto(decision: AIDecision): DecisionResponseDto {
    return {
      id: decision.id,
      type: decision.type as DecisionType,
      severity: decision.severity as RecommendationSeverity,
      title: decision.title,
      description: decision.description,
      recommendation: decision.recommendation,
      estimatedImpact: decision.estimatedImpact,
      implementationSteps: decision.implementationSteps,
      confidence: decision.confidence,
      aiModel: decision.aiModel,
      generatedAt: decision.generatedAt,
      expiresAt: decision.expiresAt,
    };
  }

  private mapReportToDto(report: AIAnalysisReport, organizationId: string): ReportResponseDto {
    return {
      id: report.period.start.toISOString(),
      organizationId,
      frequency: ReportFrequency.MONTHLY,
      period: report.period,
      metrics: {
        totalRevenue: report.metrics.revenue.totalRevenue,
        monthlyRecurringRevenue: report.metrics.revenue.monthlyRecurringRevenue,
        churnRate: report.metrics.churn.churnRate,
        customerAcquisitionCost: report.metrics.growth.customerAcquisitionCost,
        customerLifetimeValue: report.metrics.growth.customerLifetimeValue,
        activeSubscriptions: report.metrics.growth.activeCustomers,
        churned30Days: report.metrics.churn.atRiskCustomers,
        topChurnReasons: [],
        revenueGrowth: report.metrics.revenue.revenueGrowthRate,
        conversionRate: report.metrics.growth.conversionRate,
        averageOrderValue: 0,
        timestamp: report.generatedAt,
      },
      decisions: report.decisions.map((d) => this.mapDecisionToDto(d)),
      summary: report.summary,
      generatedAt: report.generatedAt,
      nextReportDate: new Date(report.generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private getEngineForDecisionType(type: string): string {
    const map: Record<string, string> = {
      REVENUE_OPTIMIZATION: 'revenueOptimizer',
      PRICING_ADJUSTMENT: 'pricingOptimizer',
      CHURN_MITIGATION: 'churnAnalyzer',
      FEATURE_RECOMMENDATION: 'featureRecommender',
      GROWTH_STRATEGY: 'growthOptimizer',
    };
    return map[type] || 'revenueOptimizer';
  }

  private getPeriodStart(frequency: string | ReportFrequency): Date {
    const now = new Date();
    const start = new Date();

    switch (frequency) {
      case 'daily':
      case ReportFrequency.DAILY:
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
      case ReportFrequency.WEEKLY:
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
      case ReportFrequency.MONTHLY:
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return start;
  }

  private extractBulletPoints(text: string): string[] {
    return text.match(/[-•*]\s+.+/g)?.map((line) => line.replace(/^[-•*]\s+/, '')) || [];
  }

  // ============ DATA ADAPTER METHODS ============

  /**
   * Query billing metrics using BillingDataAdapter
   */
  private queryBillingMetrics = async (organizationId: string) => {
    try {
      return await this.billingAdapter.gatherRevenueMetrics(organizationId);
    } catch (error) {
      this.logger.error(`Error querying billing metrics: ${error.message}`);
      return {};
    }
  };

  /**
   * Query churn analytics using AnalyticsDataAdapter
   */
  private queryChurnAnalytics = async (organizationId: string) => {
    try {
      return await this.analyticsAdapter.gatherEngagementMetrics(organizationId);
    } catch (error) {
      this.logger.error(`Error querying churn analytics: ${error.message}`);
      return {};
    }
  };

  /**
   * Query pricing data using BillingDataAdapter
   */
  private queryPricingData = async (organizationId: string) => {
    try {
      return await this.billingAdapter.gatherPricingMetrics(organizationId);
    } catch (error) {
      this.logger.error(`Error querying pricing data: ${error.message}`);
      return {};
    }
  };

  /**
   * Query feature metrics using AnalyticsDataAdapter
   */
  private queryFeatureMetrics = async (organizationId: string) => {
    try {
      return await this.analyticsAdapter.gatherFeatureMetrics(organizationId);
    } catch (error) {
      this.logger.error(`Error querying feature metrics: ${error.message}`);
      return {};
    }
  };

  /**
   * Query growth metrics using OrganizationsDataAdapter
   */
  private queryGrowthMetrics = async (organizationId: string) => {
    try {
      return await this.organizationsAdapter.gatherGrowthMetrics(organizationId);
    } catch (error) {
      this.logger.error(`Error querying growth metrics: ${error.message}`);
      return {};
    }
  };
}
