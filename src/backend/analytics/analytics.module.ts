import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsDashboardService } from './services/analytics-dashboard.service';
import { AnalyticsIntelligenceService } from './services/analytics-intelligence.service';
import { AnalyticsPipelineService } from './services/analytics-pipeline.service';
import { AnalyticsRecommendationService } from './services/analytics-recommendation.service';
import { AnalyticsTrackingService } from './services/analytics-tracking.service';

@Module({
  imports: [CommonModule, ConfigModule, AIModule],
  controllers: [AnalyticsController],
  providers: [
    PrismaService,
    AnalyticsPipelineService,
    AnalyticsTrackingService,
    AnalyticsDashboardService,
    AnalyticsIntelligenceService,
    AnalyticsRecommendationService,
  ],
  exports: [AnalyticsDashboardService, AnalyticsTrackingService],
})
export class AnalyticsModule {}