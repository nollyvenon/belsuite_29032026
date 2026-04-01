import { Injectable } from '@nestjs/common';
import { AIDecision, AnalysisContext, DecisionEngine, RevenueMetrics } from '../types/ai-ceo.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Revenue Optimizer Engine
 * Analyzes revenue trends, growth patterns, and provides optimization recommendations
 */
@Injectable()
export class RevenueOptimizerEngine implements DecisionEngine {
  async analyze(context: AnalysisContext): Promise<AIDecision> {
    const revenue = context.revenueMetrics;
    const growth = context.growthMetrics;

    let severity = 'low';
    let confidence = 0.7;
    let recommendation = '';
    let title = '';
    let description = '';

    // Analyze revenue growth rate
    const growthRate = revenue.revenueGrowthRate || 0;
    const mrrTrend = this.calculateTrend(revenue.revenueGrowthTrend || []);

    // Threshold analysis
    if (growthRate < 5) {
      severity = 'high';
      confidence = 0.85;
      title = 'Revenue Growth Below Target';
      description = `Current growth rate is ${growthRate.toFixed(2)}%, which is significantly below industry benchmarks of 10-15% for SaaS companies.`;
      recommendation = this.generateRevenueGrowthRecommendation(context);
    } else if (growthRate >= 5 && growthRate < 10) {
      severity = 'medium';
      confidence = 0.80;
      title = 'Revenue Growth Moderate';
      description = `Current growth rate of ${growthRate.toFixed(2)}% is steady but could be improved.`;
      recommendation = this.generateModerateGrowthRecommendation(context);
    } else {
      severity = 'low';
      confidence = 0.75;
      title = 'Revenue Growth On Track';
      description = `Current growth rate of ${growthRate.toFixed(2)}% is healthy and meeting targets.`;
      recommendation = 'Continue monitoring MRR growth. Focus on operational efficiency and customer retention.';
    }

    const projectedValue = revenue.monthlyRecurringRevenue * (1 + growthRate / 100);
    const percentChange = ((projectedValue - revenue.monthlyRecurringRevenue) / revenue.monthlyRecurringRevenue) * 100;

    return {
      id: uuidv4(),
      type: 'REVENUE_OPTIMIZATION',
      severity: severity as any,
      title,
      description,
      recommendation,
      estimatedImpact: {
        metric: 'Monthly Recurring Revenue (MRR)',
        currentValue: revenue.monthlyRecurringRevenue,
        projectedValue,
        percentChange,
      },
      implementationSteps: this.getImplementationSteps(growthRate, context),
      confidence,
      aiModel: 'gpt-4-turbo',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  async validate(decision: AIDecision): Promise<boolean> {
    return (
      decision.confidence >= 0.6 &&
      decision.estimatedImpact.percentChange >= -50 &&
      decision.estimatedImpact.percentChange <= 500
    );
  }

  private calculateTrend(trend: Array<{ date: string; value: number }>): number {
    if (trend.length < 2) return 0;

    const values = trend.map((t) => t.value);
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (values[i] - yMean);
      denominator += (xValues[i] - xMean) ** 2;
    }

    return denominator !== 0 ? (numerator / denominator) * 100 : 0;
  }

  private generateRevenueGrowthRecommendation(context: AnalysisContext): string {
    const topDrivers = (context.revenueMetrics.topRevenueDrivers || []).slice(0, 2);
    const driverText = topDrivers.map((d) => `${d.feature} (${(d.contribution * 100).toFixed(1)}%)`).join(', ');

    return `1. Focus on high-performing features: ${driverText || 'Upgrade enterprise tiers'}
2. Implement pricing optimization strategy - consider adding annual billing discounts
3. Expand upsell opportunities through feature bundling
4. Accelerate sales team training and outreach
5. Create targeted expansion campaigns for existing customers`;
  }

  private generateModerateGrowthRecommendation(context: AnalysisContext): string {
    return `1. Analyze customer acquisition funnel for optimization opportunities
2. Implement retention programs to reduce churn
3. Develop feature expansion roadmap based on customer requests
4. Consider strategic pricing adjustments to improve unit economics
5. Launch cross-sell and upsell initiatives`;
  }

  private getImplementationSteps(growthRate: number, context: AnalysisContext): string[] {
    if (growthRate < 5) {
      return [
        'Conduct customer discovery interviews to identify growth blockers',
        'Review and optimize pricing strategy with competitive analysis',
        'Implement customer retention program to reduce churn',
        'Accelerate feature development on top revenue drivers',
        'Expand sales team and marketing budget',
        'Review 60-day impact against baseline',
      ];
    }

    return [
      'Benchmark current growth against industry standards',
      'Identify and invest in top-performing features',
      'Optimize customer acquisition channels for better ROI',
      'Implement customer success programs for retention',
      'Consider portfolio expansion or adjacent product offerings',
      'Review 30-day impact metrics',
    ];
  }
}
