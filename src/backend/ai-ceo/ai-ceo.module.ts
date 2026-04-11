import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AICEOController } from './controllers/ai-ceo.controller';

// Services
import { AICEOService } from './services/ai-ceo.service';

// Engines
import {
  RevenueOptimizerEngine,
  PricingOptimizerEngine,
  ChurnAnalyzerEngine,
  FeatureRecommenderEngine,
  GrowthOptimizerEngine,
} from './engines';

// Data Adapters
import { BillingDataAdapter } from './adapters/billing.adapter';
import { AnalyticsDataAdapter } from './adapters/analytics.adapter';
import { OrganizationsDataAdapter } from './adapters/organizations.adapter';

// Database and shared modules
import { PrismaService } from '../database/prisma.service';

/**
 * AI CEO Module
 * Autonomous decision-making system for business intelligence and optimization
 */
@Module({
  imports: [
    // Register job queues for async processing
    BullModule.registerQueue(
      {
        name: 'ai-ceo-decisions',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'ai-ceo-reports',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
    ),
    // Schedule support for cron jobs
    ScheduleModule.forRoot(),
  ],
  controllers: [AICEOController],
  providers: [
    AICEOService,
    // Decision Engines
    RevenueOptimizerEngine,
    PricingOptimizerEngine,
    ChurnAnalyzerEngine,
    FeatureRecommenderEngine,
    GrowthOptimizerEngine,
    // Data Adapters
    BillingDataAdapter,
    AnalyticsDataAdapter,
    OrganizationsDataAdapter,
    // Services
    PrismaService,
  ],
  exports: [AICEOService],
})
export class AICEOModule {}
