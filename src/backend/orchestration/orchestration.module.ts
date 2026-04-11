import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { AIGatewayModule } from '../ai-gateway/ai-gateway.module';
import { ORCHESTRATION_QUEUE } from './orchestration.types';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationWebhooksController } from './orchestration-webhooks.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { IntentRecognitionService } from './services/intent-recognition.service';
import { OrchestrationTaskRoutingService } from './services/task-routing.service';
import { ServiceExecutionService } from './services/service-execution.service';
import { WorkflowStorageService } from './services/workflow-storage.service';
import { WorkflowProcessor } from './processors/workflow.processor';
import { ChannelAdapterService } from './services/channel-adapter.service';
import { ChannelDeliveryService } from './services/channel-delivery.service';
import { CrmEventSubscriberService } from './services/crm-event-subscriber.service';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    AIGatewayModule,
    BullModule.registerQueue({
      name: ORCHESTRATION_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 500,
        attempts: 4,
        backoff: { type: 'exponential', delay: 2000 },
      },
    }),
  ],
  controllers: [OrchestrationController, OrchestrationWebhooksController],
  providers: [
    WorkflowEngineService,
    IntentRecognitionService,
    OrchestrationTaskRoutingService,
    ServiceExecutionService,
    WorkflowStorageService,
    WorkflowProcessor,
    ChannelAdapterService,
    ChannelDeliveryService,
    CrmEventSubscriberService,
  ],
  exports: [WorkflowEngineService],
})
export class OrchestrationModule {}
