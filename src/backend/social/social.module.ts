/**
 * Social Media Scheduler Module
 * Registers all publishers, services, processor, and the BullMQ queue.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from '../database/prisma.service';
import { AppConfig } from '../config/app.config';

// Queue constant
import { SOCIAL_QUEUE, SocialPostProcessor } from './processors/social-post.processor';

// Controller
import { SocialController } from './social.controller';

// Services
import { SocialAccountService } from './services/social-account.service';
import { PostSchedulerService } from './services/post-scheduler.service';
import { BulkPostService } from './services/bulk-post.service';
import { AutoRepostService } from './services/auto-repost.service';
import { OptimalTimeService } from './services/optimal-time.service';
import { AutoCreatorService } from './services/auto-creator.service';
import { RetryDashboardService } from './services/retry-dashboard.service';
import { SchedulingPolicyService } from './services/scheduling-policy.service';
import { SocialWebhookService } from './services/social-webhook.service';

// Publishers
import { InstagramPublisher } from './services/publishers/instagram.publisher';
import { FacebookPublisher } from './services/publishers/facebook.publisher';
import { TwitterPublisher } from './services/publishers/twitter.publisher';
import { TikTokPublisher } from './services/publishers/tiktok.publisher';
import { LinkedInPublisher } from './services/publishers/linkedin.publisher';
import { PinterestPublisher } from './services/publishers/pinterest.publisher';
import { WhatsAppPublisher } from './services/publishers/whatsapp.publisher';

@Module({
  imports: [
    ConfigModule, // ensures ConfigService is available
    BullModule.registerQueue({
      name: SOCIAL_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
      },
    }),
  ],
  controllers: [SocialController],
  providers: [
    PrismaService,
    AppConfig,

    // Platform publishers
    InstagramPublisher,
    FacebookPublisher,
    TwitterPublisher,
    TikTokPublisher,
    LinkedInPublisher,
    PinterestPublisher,
    WhatsAppPublisher,

    // Core services
    SocialAccountService,
    OptimalTimeService,
    PostSchedulerService,
    BulkPostService,
    AutoRepostService,
    AutoCreatorService,
    RetryDashboardService,
    SchedulingPolicyService,
    SocialWebhookService,

    // BullMQ processor
    SocialPostProcessor,
  ],
  exports: [
    SocialAccountService,
    PostSchedulerService,
    OptimalTimeService,
    SchedulingPolicyService,
  ],
})
export class SocialModule {}
