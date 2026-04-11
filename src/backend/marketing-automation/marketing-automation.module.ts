import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { EmailModule } from '../email/email.module';
import { MarketingAutomationController } from './marketing-automation.controller';
import { MarketingAutomationService } from './marketing-automation.service';
import { MARKETING_AUTOMATION_QUEUE, MarketingAutomationProcessor } from './processors/marketing-automation.processor';
import { ChannelDispatchService } from './services/channel-dispatch.service';

@Module({
  imports: [
    CommonModule,
    AIModule,
    EmailModule,
    BullModule.registerQueue({
      name: MARKETING_AUTOMATION_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    }),
  ],
  controllers: [MarketingAutomationController],
  providers: [
    PrismaService,
    MarketingAutomationService,
    ChannelDispatchService,
    MarketingAutomationProcessor,
  ],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}
