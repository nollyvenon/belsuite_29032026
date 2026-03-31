import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { AICapability, AIModel } from '../../ai/types/ai.types';
import { AnalyticsInsight } from '../analytics.types';
import { AnalyticsDashboardService } from './analytics-dashboard.service';

@Injectable()
export class AnalyticsRecommendationService {
  private readonly logger = new Logger(AnalyticsRecommendationService.name);

  constructor(
    private readonly dashboard: AnalyticsDashboardService,
    private readonly aiService: AIService,
  ) {}

  async getRecommendations(organizationId: string, userId: string, days = 30): Promise<AnalyticsInsight[]> {
    const snapshot = await this.dashboard.getDashboard(organizationId, days);
    const heuristicInsights = this.buildHeuristicInsights(snapshot);

    try {
      const prompt = [
        'You are an analytics strategist for a SaaS growth dashboard.',
        'Return JSON only in the shape {"insights":[{"title":"...","summary":"...","action":"...","type":"positive|warning|opportunity","confidence":0.0}]}.',
        'Use short, sharp recommendations grounded in the metrics provided.',
        `Overview: ${JSON.stringify(snapshot.overview)}`,
        `Top content: ${JSON.stringify(snapshot.topContent.slice(0, 5))}`,
        `Revenue attribution: ${JSON.stringify(snapshot.revenueAttribution.slice(0, 5))}`,
        `Engagement breakdown: ${JSON.stringify(snapshot.engagementBreakdown)}`,
      ].join('\n');

      const response = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_3_5_TURBO,
          temperature: 0.35,
          maxTokens: 800,
          metadata: { capability: AICapability.SUMMARIZATION, feature: 'analytics-recommendations' },
        },
        organizationId,
        userId,
        { type: 'cheapest' },
        true,
      );

      const parsed = this.parseAIInsights(response.text);
      return parsed.length > 0 ? parsed : heuristicInsights;
    } catch (error) {
      this.logger.warn(`AI recommendation fallback triggered: ${(error as Error).message}`);
      return heuristicInsights;
    }
  }

  private buildHeuristicInsights(snapshot: Awaited<ReturnType<AnalyticsDashboardService['getDashboard']>>): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    const overview = snapshot.overview;
    const topContent = snapshot.topContent[0];
    const topSource = snapshot.revenueAttribution[0];

    if (overview.totalEvents < 25) {
      insights.push({
        title: 'Tracking coverage is thin',
        summary: 'Your dashboard has limited event volume, so some engagement and attribution conclusions will remain noisy.',
        action: 'Instrument more view, click, save, and conversion events across content and post surfaces.',
        type: 'warning',
        confidence: 0.92,
      });
    }

    if (topContent && topContent.engagementRate >= 8) {
      insights.push({
        title: `${topContent.type} content is outperforming`,
        summary: `${topContent.title} is leading the pack with a ${topContent.engagementRate}% engagement rate.`,
        action: `Create follow-up assets in the same ${topContent.type.toLowerCase()} format and reuse its opening hook pattern.`,
        type: 'positive',
        confidence: 0.88,
      });
    }

    if (overview.trackedViews > 0 && overview.conversions / overview.trackedViews < 0.02) {
      insights.push({
        title: 'Reach is not converting efficiently',
        summary: 'The funnel is generating attention, but conversion density is still low relative to tracked views.',
        action: 'Tighten call-to-action placement, test higher-intent landing pages, and reduce friction on forms or checkout.',
        type: 'opportunity',
        confidence: 0.84,
      });
    }

    if (topSource && topSource.percentage >= 50) {
      insights.push({
        title: `${topSource.source} is the dominant revenue source`,
        summary: `${topSource.source} currently drives ${topSource.percentage}% of attributed revenue.`,
        action: `Increase budget and content output around ${topSource.source}, but add a second acquisition source to reduce concentration risk.`,
        type: 'opportunity',
        confidence: 0.86,
      });
    }

    if (insights.length === 0) {
      insights.push({
        title: 'Baseline performance is stable',
        summary: 'No extreme strengths or drop-offs stand out yet across content, social, revenue, and attribution.',
        action: 'Keep publishing consistently and add more tracked experiments so the recommendation engine has sharper signals.',
        type: 'positive',
        confidence: 0.75,
      });
    }

    return insights.slice(0, 4);
  }

  private parseAIInsights(raw: string): AnalyticsInsight[] {
    try {
      const parsed = JSON.parse(raw) as { insights?: AnalyticsInsight[] };
      return Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : [];
    } catch {
      return [];
    }
  }
}