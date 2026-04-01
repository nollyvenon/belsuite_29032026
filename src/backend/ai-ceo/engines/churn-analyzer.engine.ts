import { Injectable } from '@nestjs/common';
import { AIDecision, AnalysisContext, DecisionEngine, ChurnMetrics } from '../types/ai-ceo.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Churn Analyzer Engine
 * Detects churn patterns, identifies at-risk customer segments, and recommends retention strategies
 */
@Injectable()
export class ChurnAnalyzerEngine implements DecisionEngine {
  async analyze(context: AnalysisContext): Promise<AIDecision> {
    const churn = context.churnMetrics;
    const growth = context.growthMetrics;
    const revenue = context.revenueMetrics;

    const churnRate = churn.churnRate || 0;
    let severity = 'low';
    let confidence = 0.80;
    let title = '';
    let description = '';
    let recommendation = '';
    let projectedLoss = 0;

    // Analyze churn severity
    if (churnRate > 10) {
      severity = 'critical';
      confidence = 0.90;
      title = 'Critical Churn Alert';
      description = `Churn rate is ${churnRate.toFixed(2)}%, significantly above healthy levels (3-5% for SaaS).`;
      recommendation = this.generateCriticalChurnRecommendation(churn, context);
      projectedLoss = churnRate * revenue.monthlyRecurringRevenue * 0.12; // Annual impact
    } else if (churnRate > 5) {
      severity = 'high';
      confidence = 0.85;
      title = 'Elevated Churn Rate Detected';
      description = `Churn rate of ${churnRate.toFixed(2)}% indicates potential product-market fit issues.`;
      recommendation = this.generateHighChurnRecommendation(churn, context);
      projectedLoss = (churnRate - 3) * revenue.monthlyRecurringRevenue * 0.12;
    } else if (churnRate > 3) {
      severity = 'medium';
      confidence = 0.75;
      title = 'Moderate Churn Requiring Attention';
      description = `Churn rate of ${churnRate.toFixed(2)}% is within acceptable range but trending upward.`;
      recommendation = this.generateModerateChurnRecommendation(churn, context);
      projectedLoss = 0;
    } else {
      severity = 'low';
      confidence = 0.70;
      title = 'Churn Rate Healthy';
      description = `Churn rate of ${churnRate.toFixed(2)}% is within industry benchmarks.`;
      recommendation = 'Continue monitoring retention metrics monthly. Maintain current customer success programs.';
      projectedLoss = 0;
    }

    // Identify at-risk segments
    const atRiskSegments = this.identifyAtRiskSegments(churn);
    const topChurnReasons = Array.from(churn.churnReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);

    const projectedValue = revenue.monthlyRecurringRevenue * 12; // Annual value
    const percentChange = -(projectedLoss / projectedValue) * 100;

    return {
      id: uuidv4(),
      type: 'CHURN_MITIGATION',
      severity: severity as any,
      title,
      description,
      recommendation,
      estimatedImpact: {
        metric: 'Annual Recurring Revenue (ARR) Loss Prevention',
        currentValue: projectedValue,
        projectedValue: projectedValue - projectedLoss,
        percentChange,
      },
      implementationSteps: this.getImplementationSteps(severity, atRiskSegments, topChurnReasons),
      confidence,
      aiModel: 'gpt-4-turbo',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days - high priority
    };
  }

  async validate(decision: AIDecision): Promise<boolean> {
    return (
      decision.confidence >= 0.6 &&
      decision.estimatedImpact.percentChange >= -50 &&
      decision.estimatedImpact.percentChange <= 0 // Should show loss prevention only
    );
  }

  private identifyAtRiskSegments(churn: ChurnMetrics): Array<{ segment: string; churnRate: number; recommendation: string }> {
    const segmentChurni = churn.customerSegmentChurn || [];
    const overallRate = churn.churnRate;

    return segmentChurni
      .filter((s) => s.churnRate > overallRate * 1.5) // 50% higher than average
      .map((s) => ({
        segment: s.segment,
        churnRate: s.churnRate,
        recommendation: this.getSegmentRetentionStrategy(s.segment, s.churnRate),
      }))
      .slice(0, 5); // Top 5 at-risk segments
  }

  private getSegmentRetentionStrategy(segment: string, churnRate: number): string {
    const strategies: Record<string, string> = {
      'startup': 'Offer flexible pricing or payment terms. Provide dedicated onboarding support.',
      'enterprise': 'Assign dedicated account manager. Quarterly business reviews to showcase ROI.',
      'trial': 'Implement post-trial engagement campaigns. Offer extended trial or discount for conversion.',
      'low-tier': 'Create upgrade incentives with feature bundles. Run limited-time promotional offers.',
      'inactive': 'Win-back campaigns with special offers. Analyze usage patterns to understand reasons for disengagement.',
      'seasonal': 'Plan seasonal engagement campaigns. Offer annual contracts with discounts.',
    };

    return strategies[segment] || 'Conduct direct outreach to understand churn reasons. Develop targeted retention offers.';
  }

  private generateCriticalChurnRecommendation(churn: ChurnMetrics, context: AnalysisContext): string {
    const topReasons = Array.from(churn.churnReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => `${e[0]} (${e[1]} customers)`)
      .join(', ');

    return `URGENT: Implement immediate retention actions:

Top Churn Reasons: ${topReasons}

Immediate Actions (implement within 48-72 hours):
1. Executive outreach to key at-risk customers
2. Freeze all price increases for current customers
3. Activate win-back campaign for recently churned customers
4. Implement customer success hotline for support
5. Audit product quality and performance issues

Medium-term (2-4 weeks):
1. Conduct exit interviews with churned customers
2. Develop product roadmap addressing top churn drivers
3. Implement enhanced onboarding program
4. Create customer success tier with proactive outreach
5. Establish churn prevention task force`;
  }

  private generateHighChurnRecommendation(churn: ChurnMetrics, context: AnalysisContext): string {
    return `High Churn Mitigation Strategy:

1. Customer Health Score Implementation
   - Develop predictive model using engagement metrics
   - Identify at-risk customers before they churn
   - Implement automated alerts for CS team

2. Retention Programs
   - Launch loyalty program for long-term customers
   - Create early warning system for disengaged users
   - Develop win-back campaigns for recent churners

3. Product Quality Assessment
   - Conduct feature adoption analysis
   - Identify and fix critical bugs
   - Improve onboarding and documentation

4. Pricing Review
   - Analyze if price is primary churn driver
   - Consider cohort-based pricing strategies
   - Offer retention discounts for at-risk accounts`;
  }

  private generateModerateChurnRecommendation(churn: ChurnMetrics, context: AnalysisContext): string {
    return `Churn Management Best Practices:

1. Monitor Key Metrics
   - Weekly churn tracking by cohort
   - Monthly trend analysis
   - Early warning system implementation

2. Proactive Engagement
   - Send product updates to inactive users
   - Quarterly business reviews with key accounts
   - Personalized outreach based on usage patterns

3. Feedback Collection
   - Post-cancellation surveys
   - Usage analytics review
   - Customer interviews with high-value churners

4. Continuous Improvement
   - Product updates addressing feedback
   - Customer success team expansion
   - Enhanced support responsiveness`;
  }

  private getImplementationSteps(severity: string, atRiskSegments: any[], topReasons: string[]): string[] {
    const baseSteps = [
      'Conduct root cause analysis for top churn drivers',
      'Segment customer base by churn risk',
      'Develop targeted retention campaigns by segment',
    ];

    if (severity === 'critical') {
      return [
        'Set up daily churn monitoring alerts',
        'Convene emergency customer success meeting',
        ...baseSteps,
        'Activate personal outreach to top 20 at-risk accounts',
        'Review and improve product performance',
        'Establish executive-level customer retention oversight',
        'Review metrics daily until churn improves',
      ];
    }

    if (severity === 'high') {
      return [
        'Implement customer health scoring system',
        ...baseSteps,
        'Weekly monitoring of key retention metrics',
        'Launch quarterly business review program',
        'Enhance customer success team training',
        'Review progress every 2 weeks',
      ];
    }

    return [
      ...baseSteps,
      'Monthly churn review meetings',
      'Quarterly product roadmap assessment',
      'Ongoing customer feedback collection',
    ];
  }
}
