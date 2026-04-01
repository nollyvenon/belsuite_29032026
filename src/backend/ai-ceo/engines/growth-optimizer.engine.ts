import { Injectable } from '@nestjs/common';
import { AIDecision, AnalysisContext, DecisionEngine } from '../types/ai-ceo.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Growth Optimizer Engine
 * Analyzes growth metrics and recommends strategies for revenue acceleration
 */
@Injectable()
export class GrowthOptimizerEngine implements DecisionEngine {
  async analyze(context: AnalysisContext): Promise<AIDecision> {
    const growth = context.growthMetrics;
    const revenue = context.revenueMetrics;
    const churn = context.churnMetrics;

    let recommendation = '';
    let severity = 'medium';
    let confidence = 0.75;
    let title = '';
    let description = '';
    let projectedImpact = 10;

    // Analyze growth components
    const cac = growth.customerAcquisitionCost || 0;
    const ltr = growth.customerLifetimeValue || 0;
    const cacroi = ltr > 0 && cac > 0 ? ltr / cac : 0;
    const payback = growth.paybackPeriod || 0;

    // LTV:CAC analysis
    if (cacroi < 3) {
      severity = 'high';
      confidence = 0.85;
      title = 'Unfavorable Unit Economics';
      description = `LTV:CAC ratio of ${cacroi.toFixed(2)}x is below healthy target of 3:1. Sustainable growth at risk.`;
      recommendation = this.generateUnitEconomicsRecommendation(context);
      projectedImpact = 5;
    } else if (cacroi >= 3 && cacroi < 5) {
      severity = 'medium';
      confidence = 0.80;
      title = 'Good Unit Economics - Optimization Opportunity';
      description = `LTV:CAC ratio of ${cacroi.toFixed(2)}x is healthy. Opportunity to accelerate growth with scaling.`;
      recommendation = this.generateScalingRecommendation(context);
      projectedImpact = 15;
    } else {
      severity = 'low';
      confidence = 0.75;
      title = 'Excellent Unit Economics';
      description = `LTV:CAC ratio of ${cacroi.toFixed(2)}x supports aggressive growth investment.`;
      recommendation = this.generateAggresiveGrowthRecommendation(context);
      projectedImpact = 25;
    }

    // Adjust based on payback period
    if (payback > 12) {
      projectedImpact = Math.max(5, projectedImpact - 10);
      description += ' However, long payback period limits growth investment capacity.';
    }

    const projectedValue = revenue.monthlyRecurringRevenue * (1 + projectedImpact / 100);

    return {
      id: uuidv4(),
      type: 'GROWTH_STRATEGY',
      severity: severity as any,
      title,
      description,
      recommendation,
      estimatedImpact: {
        metric: 'Monthly Recurring Revenue (MRR)',
        currentValue: revenue.monthlyRecurringRevenue,
        projectedValue,
        percentChange: projectedImpact,
      },
      implementationSteps: this.getImplementationSteps(severity, cacroi),
      confidence,
      aiModel: 'gpt-4-turbo',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  async validate(decision: AIDecision): Promise<boolean> {
    return (
      decision.confidence >= 0.6 &&
      decision.estimatedImpact.percentChange >= 0 &&
      decision.estimatedImpact.percentChange <= 100
    );
  }

  private generateUnitEconomicsRecommendation(context: AnalysisContext): string {
    const growth = context.growthMetrics;
    const cac = growth.customerAcquisitionCost || 0;
    const ltv = growth.customerLifetimeValue || 0;

    return `Unit Economics Improvement Plan:

Current Challenges:
- LTV:CAC ratio (${(ltv / (cac || 1)).toFixed(2)}x) below sustainable threshold
- Limited runway for growth investment
- Risk of profitability challenges

Priority Actions:

1. Reduce Customer Acquisition Cost (Immediate):
   a) Analyze CAC by channel - cut underperforming channels
   b) Shift budget to high-efficiency channels (referral, organic)
   c) Optimize sales and marketing processes
   d) Reduce sales cycle length through automation
   
2. Increase Customer Lifetime Value (Parallel):
   a) Reduce churn through improved retention programs
   b) Expand average revenue per user (upsells, cross-sells)
   c) Focus sales efforts on higher-value customer segments
   d) Implement customer success programs to reduce support cost
   
3. Optimize Price & Product:
   a) Review pricing structure for profitability
   b) Implement freemium-to-paid conversion optimization
   c) Segmented pricing for high-value customers
   
Expected Outcomes:
- Target LTV:CAC ratio of 3:1 within 6 months
- Sustainable growth economics
- Foundation for scaling`;
  }

  private generateScalingRecommendation(context: AnalysisContext): string {
    const growth = context.growthMetrics;

    return `Growth Scaling Strategy:

Current Position:
- Healthy unit economics enable growth investment
- Payback period: ${growth.paybackPeriod?.toFixed(1)}months
- Opportunity to invest in accelerated acquisition

Recommended Growth Tactics:

1. Marketing Expansion (30-40% budget increase):
   - Increase paid advertising spend across performing channels
   - Expand geographic markets
   - Develop content marketing program
   - Launch partnership marketing initiatives
   
2. Sales Team Growth:
   - Hire 2-3 additional sales reps
   - Expand into enterprise segment
   - Implement account-based marketing
   
3. Product-Led Growth:
   - Optimize free trial conversion
   - Develop product virality loops
   - Improve onboarding for self-serve segment
   
4. Strategic Partnerships:
   - API integrations with complementary tools
   - Channel partner program for indirect sales
   - OEM opportunities
   
Financial Framework:
- Allocate ${Math.round((context.revenueMetrics.monthlyRecurringRevenue * 0.2 * 12) / 1000)} K annually to grow acquisition
- Target customer acquisition: 20-25% increase YoY
- Expected payback: ${growth.paybackPeriod?.toFixed(1)}months remains manageable`;
  }

  private generateAggresiveGrowthRecommendation(context: AnalysisContext): string {
    const growth = context.growthMetrics;
    const revenue = context.revenueMetrics;

    return `Aggressive Growth Acceleration Plan:

Current Strengths:
- Excellent unit economics (LTV:CAC > 5x)
- Strong payback period: ${growth.paybackPeriod?.toFixed(1)} months
- Reinvestment capacity available
- Market opportunity exists

Aggressive Growth Initiatives:

1. Sales & Marketing Offensive (50% budget increase):
   a) Expand sales team by 50% (add 7-10 reps)
   b) Launch major marketing campaigns
   c) Increase paid acquisition spend
   d) Develop brand awareness program
   e) Venture into new verticals
   
2. Market Expansion:
   - Enter 2-3 new geographic regions
   - Develop vertical-specific solutions
   - Target enterprise segment more aggressively
   - Build channel sales program
   
3. Product Acceleration:
   - Accelerate feature development (50% more resources)
   - Build advanced tier(s) to capture more value
   - Develop API and integrations ecosystem
   
4. M&A Readiness:
   - Identify acquisition targets for capabilities/users
   - Prepare infrastructure for integration
   - Scout talent acquisition opportunities
   
Financial Planning:
- Growth budget: $${Math.round((revenue.monthlyRecurringRevenue * 12 * 0.35) / 1000000)}M annually
- Expected outcome: 50-75% YoY growth
- Time to breakeven: ${growth.paybackPeriod?.toFixed(1)} months (sustainable under these economics)
- Path to profitability: 24-36 months with disciplined spending

Risk Mitigation:
- Monthly cohort analysis to track unit economics
- Early warning system for CAC inflation
- Retention targets to maintain LTV growth`;
  }

  private getImplementationSteps(severity: string, cacroi: number): string[] {
    const baseSteps = [
      'Establish growth metrics dashboard and KPIs',
      'Define success criteria and measurement approach',
      'Allocate budget across channels and initiatives',
      'Create execution timeline and milestones',
    ];

    if (severity === 'high') {
      return [
        'Set up CAC analysis by channel and campaign',
        ...baseSteps,
        'Implement cost reduction initiatives immediately',
        'Develop LTV improvement roadmap',
        'Weekly performance reviews',
        'Target: Improve ratio to 3:1 within 6 months',
      ];
    }

    if (severity === 'medium') {
      return [
        ...baseSteps,
        'Create growth investment plan with ROI targets',
        'Launch 3 major growth initiatives this quarter',
        'Monthly reviews of CAC and LTV trends',
        'Scale up highest-performing channels',
      ];
    }

    return [
      ...baseSteps,
      'Develop aggressive growth and expansion plan',
      'Identify and recruit talent for leadership expansion',
      'Plan market entry initiatives',
      'Review quarterly and adjust as needed',
    ];
  }
}
