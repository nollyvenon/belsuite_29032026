import { Injectable } from '@nestjs/common';
import { AIDecision, AnalysisContext, DecisionEngine, FeatureMetrics, ChurnMetrics } from '../types/ai-ceo.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Feature Recommender Engine
 * Analyzes feature usage patterns and recommends high-impact feature development priorities
 */
@Injectable()
export class FeatureRecommenderEngine implements DecisionEngine {
  async analyze(context: AnalysisContext): Promise<AIDecision> {
    const features = context.featureMetrics;
    const revenue = context.revenueMetrics;
    const churn = context.churnMetrics;

    let recommendation = '';
    let severity = 'medium';
    let confidence = 0.75;
    let title = '';
    let description = '';
    const projectedImpactPercent = this.calculateFeatureImpact(features, churn);

    // Analyze feature portfolio
    const highValueFeatures = this.identifyHighValueFeatures(features);
    const unusedFeatures = features.unusedFeatures || [];
    const requestedFeatures = features.requestedFeatures || [];

    // Prioritize recommendations based on analysis
    if (unusedFeatures.length > features.featureUsage.length * 0.3) {
      severity = 'high';
      confidence = 0.85;
      title = 'Feature Portfolio Inefficiency';
      description = `${((unusedFeatures.length / features.featureUsage.length) * 100).toFixed(0)}% of features are underutilized, indicating potential product bloat or poor discoverability.`;
      recommendation = this.generatePortfolioOptimizationRecommendation(features);
    } else if (requestedFeatures.length > 0 && highValueFeatures.length > 0) {
      severity = 'medium';
      confidence = 0.80;
      title = 'High-Impact Features Requested';
      description = `${requestedFeatures.length} features requested by customers align with revenue growth opportunities.`;
      recommendation = this.generateFeatureRoadmapRecommendation(requestedFeatures, highValueFeatures);
    } else if (highValueFeatures.length > 0) {
      severity = 'low';
      confidence = 0.80;
      title = 'Feature Roadmap Opportunity';
      description = `${highValueFeatures.length} high-value features identified for development focus.`;
      recommendation = this.generateFeatureDevelopmentRecommendation(highValueFeatures);
    } else {
      severity = 'low';
      confidence = 0.65;
      title = 'Feature Adoption Healthy';
      description = 'Feature usage distribution is balanced and healthy.';
      recommendation = 'Continue monitoring adoption patterns. Maintain current feature roadmap priorities.';
    }

    const projectedValue = revenue.monthlyRecurringRevenue * (1 + projectedImpactPercent / 100);

    return {
      id: uuidv4(),
      type: 'FEATURE_RECOMMENDATION',
      severity: severity as any,
      title,
      description,
      recommendation,
      estimatedImpact: {
        metric: 'Monthly Recurring Revenue (MRR) from Feature Development',
        currentValue: revenue.monthlyRecurringRevenue,
        projectedValue,
        percentChange: projectedImpactPercent,
      },
      implementationSteps: this.getImplementationSteps(severity, highValueFeatures, requestedFeatures),
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

  private identifyHighValueFeatures(
    features: FeatureMetrics,
  ): Array<{ name: string; score: number; description: string }> {
    const usage = features.featureUsage || [];

    // Calculate composite score: (adoption + engagement + revenue) / 3
    const scoredFeatures = usage.map((f) => ({
      name: f.featureName,
      adoptionRate: f.adoptionRate || 0,
      engagementScore: f.engagementScore || 0,
      revenueContribution: f.revenueContribution || 0,
      satisfaction: f.userSatisfaction || 0,
    }));

    const avgAdoption = scoredFeatures.reduce((sum, f) => sum + f.adoptionRate, 0) / scoredFeatures.length;
    const avgEngagement = scoredFeatures.reduce((sum, f) => sum + f.engagementScore, 0) / scoredFeatures.length;
    const avgRevenue = scoredFeatures.reduce((sum, f) => sum + f.revenueContribution, 0) / scoredFeatures.length;

    return scoredFeatures
      .map((f) => ({
        name: f.name,
        score: (f.adoptionRate + f.engagementScore + f.revenueContribution) / 3,
        description: this.generateFeatureDescription(f),
      }))
      .filter((f) => f.score > (avgAdoption + avgEngagement + avgRevenue) / 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private generateFeatureDescription(feature: any): string {
    const reason = 'combination of ';
    const reasons: string[] = [];

    if (feature.adoptionRate > 0.7) reasons.push('high adoption');
    if (feature.engagementScore > 0.7) reasons.push('strong engagement');
    if (feature.revenueContribution > 0.6) reasons.push('significant revenue contribution');
    if (feature.satisfaction > 0.7) reasons.push('high customer satisfaction');

    return `${reason}${reasons.join(', ')}`;
  }

  private calculateFeatureImpact(features: FeatureMetrics, churn: ChurnMetrics): number {
    const requestedCount = (features.requestedFeatures || []).length;
    const unusedCount = (features.unusedFeatures || []).length;
    const highValueCount = features.featureUsage.filter((f) => (f.revenueContribution || 0) > 0.5).length;

    // Base impact: number of requested features
    let impact = requestedCount * 2;

    // Reduce if high product bloat
    if (unusedCount > features.featureUsage.length * 0.3) {
      impact -= unusedCount * 0.5;
    }

    // Increase if can address churn
    if (churn.churnRate > 5) {
      impact += 5;
    }

    return Math.max(0, Math.min(25, impact)); // Cap between 0-25%
  }

  private generatePortfolioOptimizationRecommendation(features: FeatureMetrics): string {
    const totalFeatures = features.featureUsage.length;
    const unusedCount = (features.unusedFeatures || []).length;

    return `Feature Portfolio Optimization Needed:

Immediate Actions (Week 1):
1. Conduct feature audit and usage analysis
2. Identify features to potentially deprecate or archive
3. Review feature documentation and discoverability
4. Plan feature consolidation opportunities

Short-term (Month 1):
1. Improve onboarding to increase feature adoption
2. Create feature adoption campaigns for underused features
3. Consolidate similar features to reduce complexity
4. Monitor adoption metrics after changes

Medium-term (Quarter 1):
1. Develop feature lifecycle policy
2. Implement feature announcements and training
3. Consider removing unused features after user migration
4. Simplify UI to highlight high-value features`;
  }

  private generateFeatureRoadmapRecommendation(requestedFeatures: any[], highValueFeatures: any[]): string {
    const topRequests = requestedFeatures.slice(0, 5).map((f: any) => `- ${f.name} (${f.requestCount} requests)`).join('\n');
    const topHighValue = highValueFeatures
      .slice(0, 3)
      .map((f: any) => `- ${f.name}: ${f.description}`)
      .join('\n');

    return `Strategic Feature Development Plan:

Top Customer Requests:
${topRequests}

High-Value Feature Opportunities:
${topHighValue}

Recommended Roadmap:
1. Q1 Priority: Build top 2 requested features
2. Q2 Priority: Double-down on high-value feature enhancements
3. Q3 Priority: Implement next tier of requested features

Implementation Approach:
- Prioritize requests tied to retention/expansion
- Consider feature bundling for package upsells
- Plan phased rollout with customer communication
- Measure adoption and satisfaction metrics post-launch`;
  }

  private generateFeatureDevelopmentRecommendation(highValueFeatures: any[]): string {
    const features = highValueFeatures.slice(0, 3).map((f: any) => `- ${f.name}: ${f.description}`).join('\n');

    return `Feature Development Priorities:

High-Value Features Identified:
${features}

Strategic Roadmap:
1. Enhance and extend high-value features with new capabilities
2. Build integrations around popular features
3. Create advanced tiers around feature bundles
4. Develop customer success positioning around features

Expected Impact:
- Improved customer satisfaction
- Higher feature adoption rates
- Increased upsell opportunities
- Better competitive positioning`;
  }

  private getImplementationSteps(severity: string, highValueFeatures: any[], requestedFeatures: any[]): string[] {
    const baseSteps = [
      'Conduct customer research on feature priorities',
      'Analyze competitive feature sets',
      'Develop feature requirements and specification',
      'Plan development sprints and timelines',
    ];

    if (severity === 'high') {
      return [
        'Immediate: Audit and deprecate unused features',
        ...baseSteps,
        'Create feature adoption improvement plan',
        'Develop customer communication strategy',
        'Establish feature usage tracking metrics',
        'Review and adjust monthly',
      ];
    }

    if (severity === 'medium') {
      return [
        ...baseSteps,
        'Prioritize top 3 requested features',
        'Create development timeline (3-6 month roadmap)',
        'Communicate roadmap to key customers',
        'Review quarterly',
      ];
    }

    return [...baseSteps, 'Add to standard quarterly roadmap planning', 'Review quarterly against business priorities'];
  }
}
