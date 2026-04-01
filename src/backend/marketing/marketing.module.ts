/**
 * Marketing Engine Module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from '../common/common.module';
import { PrismaService } from '../database/prisma.service';
import { AppConfig } from '../config/app.config';

import { MarketingController } from './marketing.controller';
import { CampaignManagerService } from './services/campaign-manager.service';
import { CampaignApprovalService } from './services/campaign-approval.service';
import { AdGeneratorService } from './services/ad-generator.service';
import { ABTestService } from './services/ab-test.service';
import { BudgetOptimizerService } from './services/budget-optimizer.service';
import { PerformanceTrackingService } from './services/performance-tracking.service';
import { FunnelBuilderService } from './services/funnel-builder.service';
import { FacebookAdsService } from './services/platforms/facebook-ads.service';
import { GoogleAdsService } from './services/platforms/google-ads.service';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [MarketingController],
  providers: [
    PrismaService,
    AppConfig,

    // Core services
    CampaignManagerService,
    CampaignApprovalService,
    AdGeneratorService,
    ABTestService,
    BudgetOptimizerService,
    PerformanceTrackingService,
    FunnelBuilderService,

    // Platform adapters
    FacebookAdsService,
    GoogleAdsService,
  ],
  exports: [
    PerformanceTrackingService,
    FunnelBuilderService,
    CampaignApprovalService,
  ],
})
export class MarketingModule {}
