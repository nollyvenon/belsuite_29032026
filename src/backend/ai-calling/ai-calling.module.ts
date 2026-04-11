import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { AI_CALLING_QUEUE, AICallingProcessor } from './processors/ai-calling.processor';
import { AICallingController } from './ai-calling.controller';
import { AICallingService } from './ai-calling.service';
import { CallingProviderService } from './services/calling-provider.service';

@Module({
  imports: [
    CommonModule,
    AIModule,
    BullModule.registerQueue({
      name: AI_CALLING_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
      },
    }),
  ],
  controllers: [AICallingController],
  providers: [
    PrismaService,
    AICallingService,
    CallingProviderService,
    AICallingProcessor,
  ],
  exports: [AICallingService],
})
export class AICallingModule {}
