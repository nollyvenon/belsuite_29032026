import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { AIAutopilotController } from './ai-autopilot.controller';
import { AIAutopilotService } from './ai-autopilot.service';
import { AI_AUTOPILOT_QUEUE, AIAutopilotProcessor } from './processors/ai-autopilot.processor';

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: AI_AUTOPILOT_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
  ],
  controllers: [AIAutopilotController],
  providers: [PrismaService, AIAutopilotService, AIAutopilotProcessor],
  exports: [AIAutopilotService],
})
export class AIAutopilotModule {}
