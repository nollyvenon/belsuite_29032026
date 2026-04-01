import { Injectable } from '@nestjs/common';
import { AIDecision, AnalysisContext, DecisionEngine, PricingMetrics } from '../types/ai-ceo.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Pricing Optimizer Engine
 * Analyzes pricing structures and recommends optimal pricing strategies
 */
@Injectable()
export class PricingOptimizerEngine implements DecisionEngine {
  async analyze(context: AnalysisContext): Promise<AIDecision> {
    const pricing = context.pricingMetrics;
    const revenue = context.revenueMetrics;
    const churn = context.churnMetrics;

    let recommendation = '';
    let severity = 'medium';
    let confidence = 0.75;
    let title = '';
    let description = '';
    let projectedImpact = 0;

    // Analyze tier distribution
    const tierAnalysis = this.analyzeTierDistribution(pricing);
    const elasticity = pricing.priceElasticity || null;

    // Identify pricing optimization opportunities
    if (tierAnalysis.imbalancedTiers.length > 0) {
      severity = 'high';
      confidence = 0.85;
      title = 'Pricing Structure Imbalance Detected';
      description = `Tier distribution is skewed: ${tierAnalysis.imbalancedTiers.join(', ')} have below-average adoption.`;
      recommendation = this.generateTierOptimizationRecommendation(tierAnalysis, pricing);
      projectedImpact = tierAnalysis.potentialRevenueIncrease;
    } else if (elasticity && elasticity > 1.2) {
      severity = 'medium';
      confidence = 0.80;
      title = 'Price Increase Opportunity';
      description = `Demand elasticity suggests customers have high price tolerance. Current elasticity: ${elasticity.toFixed(2)}.`;
      recommendation = this.generatePriceIncreaseRecommendation(pricing, elasticity);
      projectedImpact = elasticity * 5; // Potential 5% revenue increase per 0.1 elasticity
    } else if (churn.churnRate > 5) {
      severity = 'high';
      confidence = 0.80;
      title = 'High Churn Suggests Pricing Mismatch';
      description = `High churn rate of ${churn.churnRate.toFixed(2)}% may indicate pricing or value mismatch.`;
      recommendation = this.generateChurnMitigationPricingRecommendation(pricing);
      projectedImpact = -churn.churnRate * 2; // Reduce churn by 2x rate
    } else {
      severity = 'low';
      confidence = 0.70;
      title = 'Pricing Strategy Healthy';
      description = 'Current pricing structure appears well-optimized for market conditions.';
      recommendation = 'Monitor market conditions and competitor pricing. Consider annual pricing adjustments based on inflation.';
      projectedImpact = 3;
    }

    const projectedValue = revenue.monthlyRecurringRevenue * (1 + projectedImpact / 100);

    return {
      id: uuidv4(),
      type: 'PRICING_ADJUSTMENT',
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
      implementationSteps: this.getImplementationSteps(severity, tierAnalysis),
      confidence,
      aiModel: 'gpt-4-turbo',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    };
  }

  async validate(decision: AIDecision): Promise<boolean> {
    return (
      decision.confidence >= 0.6 &&
      decision.estimatedImpact.percentChange >= -20 &&
      decision.estimatedImpact.percentChange <= 100
    );
  }

  private analyzeTierDistribution(pricing: PricingMetrics): {
    imbalancedTiers: string[];
    potentialRevenueIncrease: number;
    rebalancingSuggestions: Array<{ tier: string; action: string }>;
  } {
    const tiers = pricing.currentTiers || [];
    if (tiers.length === 0) {
      return { imbalancedTiers: [], potentialRevenueIncrease: 0, rebalancingSuggestions: [] };
    }

    const avgAdoptionRate = tiers.reduce((sum, t) => sum + t.adoptionRate, 0) / tiers.length;
    const imbalanced = tiers.filter((t) => t.adoptionRate < avgAdoptionRate * 0.7).map((t) => t.name);

    let potentialIncrease = 0;
    const suggestions: Array<{ tier: string; action: string }> = [];

    // Calculate potential revenue if balanced
    tiers.forEach((tier) => {
      if (tier.adoptionRate < avgAdoptionRate * 0.7) {
        const potentialSubscribers = Math.floor(tier.subscriberCount / (tier.adoptionRate || 0.01) * avgAdoptionRate);
        const additionalRevenue = (potentialSubscribers - tier.subscriberCount) * tier.price * 12;
        potentialIncrease += additionalRevenue;

        suggestions.push({
          tier: tier.name,
          action: `Reduce pricing by 10-15% or add more features to attract ${Math.floor(potentialSubscribers - tier.subscriberCount)} additional users`,
        });
      }
    });

    return { imbalancedTiers: imbalanced, potentialRevenueIncrease: potentialIncrease, rebalancingSuggestions: suggestions };
  }

  private generateTierOptimizationRecommendation(tierAnalysis: any, pricing: PricingMetrics): string {
    const suggestions = tierAnalysis.rebalancingSuggestions.map((s: any) => `- ${s.tier}: ${s.action}`).join('\n');

    return `Tier Distribution Analysis:
${suggestions}

Additional Recommendations:
- Consider consolidating underperforming tiers or repositioning them
- Run A/B tests on suggested price points
- Engage sales team for feedback on tier positioning
- Analyze feature gaps that drive adoption of higher tiers`;
  }

  private generatePriceIncreaseRecommendation(pricing: PricingMetrics, elasticity: number): string {
    const recommendedIncrease = Math.min(elasticity * 5, 25); // Cap at 25% increase

    return `Price Increase Recommendation:
- Recommended price increase: ${recommendedIncrease.toFixed(1)}%
- Implementation timeline: 30-60 days with advance notice
- Suggested approach: Grandfather existing customers for 3-6 months
- Monitor churn weekly for price sensitivity
- Prepare customer communication emphasizing value added
- Consider annual/multi-year discounts to offset perception of increase`;
  }

  private generateChurnMitigationPricingRecommendation(pricing: PricingMetrics): string {
    return `Pricing Adjustments to Reduce Churn:
- Investigate if churned customers were in lower-value tiers
- Consider introducing a lower entry-level tier for price-sensitive segments
- Offer trial extensions or discount periods to at-risk customers
- Create bundle offerings combining multiple features at better price points
- Implement value-based pricing tiers aligned with customer usage patterns
- Run win-back campaigns with special pricing for churned customers`;
  }

  private getImplementationSteps(severity: string, tierAnalysis: any): string[] {
    const baseSteps = [
      'Conduct price sensitivity analysis with current customer base',
      'Model revenue impact across different scenarios (10%, 15%, 20% changes)',
      'Prepare customer communication and FAQs',
    ];

    if (severity === 'high') {
      return [
        ...baseSteps,
        'Review contract terms for grandfather clauses',
        'Plan phased rollout (new customers first, then existing)',
        'Establish customer support escalation procedures',
        'Monitor adoption and revenue metrics daily',
        'Prepare rollback plan if churn exceeds 3% threshold',
        'Review implementation after 90 days',
      ];
    }

    return [...baseSteps, 'Implement changes for new customers immediately', 'Review after 30 days', 'Adjust based on early feedback'];
  }
}
