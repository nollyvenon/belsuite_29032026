import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventBus } from '../../common/events';
import { ORCHESTRATION_QUEUE, OrchestrationJobPayload } from '../orchestration.types';
import { IntentRecognitionService } from './intent-recognition.service';
import { OrchestrationTaskRoutingService } from './task-routing.service';
import { ServiceExecutionService } from './service-execution.service';
import { WorkflowStorageService } from './workflow-storage.service';
import { AIGatewayService } from '../../ai-gateway/ai-gateway.service';
import { GatewayTask } from '../../ai-gateway/types/gateway.types';

@Injectable()
export class WorkflowEngineService {
  constructor(
    @InjectQueue(ORCHESTRATION_QUEUE) private readonly queue: Queue<OrchestrationJobPayload>,
    private readonly events: EventBus,
    private readonly intent: IntentRecognitionService,
    private readonly routing: OrchestrationTaskRoutingService,
    private readonly execution: ServiceExecutionService,
    private readonly storage: WorkflowStorageService,
    private readonly aiGateway: AIGatewayService,
  ) {}

  async start(payload: Omit<OrchestrationJobPayload, 'stage'>) {
    await this.queue.add(
      'workflow.intent',
      { ...payload, stage: 'intent' },
      { attempts: 4, backoff: { type: 'exponential', delay: 2000 } },
    );
    return { accepted: true, correlationId: payload.correlationId };
  }

  async runStage(job: OrchestrationJobPayload) {
    if (job.stage === 'intent') return this.handleIntent(job);
    if (job.stage === 'route') return this.handleRoute(job);
    if (job.stage === 'execute') return this.handleExecute(job);
    if (job.stage === 'store') return this.handleStore(job);
    if (job.stage === 'respond') return this.handleRespond(job);
  }

  private async handleIntent(job: OrchestrationJobPayload) {
    const intent = this.intent.recognize(job.message);
    await this.storage.logStage(job.organizationId, 'workflow.intent.recognized', job.correlationId, { intent }, job.userId);
    await this.events.publish({
      id: `wf-intent-${Date.now()}`,
      type: 'workflow.intent.recognized',
      tenantId: job.organizationId,
      userId: job.userId,
      data: { intent, channel: job.channel },
      timestamp: new Date(),
      correlationId: job.correlationId,
      version: 1,
      metadata: { environment: process.env['NODE_ENV'] ?? 'development', service: 'workflow-engine' },
    });
    await this.queue.add('workflow.route', { ...job, stage: 'route', intent });
  }

  private async handleRoute(job: OrchestrationJobPayload) {
    const task = this.routing.route(job.intent ?? 'general.chat');
    await this.storage.logStage(job.organizationId, 'workflow.task.routed', job.correlationId, { task, intent: job.intent }, job.userId);
    await this.queue.add('workflow.execute', { ...job, stage: 'execute', task });
  }

  private async handleExecute(job: OrchestrationJobPayload) {
    const serviceResult = await this.execution.execute(job.task ?? 'general_assistant', job.message, job.organizationId);
    await this.storage.logStage(job.organizationId, 'workflow.service.executed', job.correlationId, { task: job.task, serviceResult }, job.userId);
    await this.queue.add('workflow.store', { ...job, stage: 'store', serviceResult });
  }

  private async handleStore(job: OrchestrationJobPayload) {
    await this.storage.logStage(job.organizationId, 'workflow.data.stored', job.correlationId, {
      channel: job.channel,
      externalUserId: job.externalUserId,
      task: job.task,
      serviceResult: job.serviceResult,
    }, job.userId);
    await this.queue.add('workflow.respond', { ...job, stage: 'respond' });
  }

  private async handleRespond(job: OrchestrationJobPayload) {
    const task = this.toGatewayTask(job.task);
    const text = await this.aiGateway.generateText(
      job.organizationId,
      task,
      'workflow_assistant',
      `User message: ${job.message}\nTask: ${job.task}\nService result: ${JSON.stringify(job.serviceResult ?? {})}\nRespond concisely for ${job.channel}.`,
      { userId: job.userId, maxTokens: 600 },
    );
    await this.storage.logStage(job.organizationId, 'workflow.response.generated', job.correlationId, { responsePreview: text.slice(0, 300) }, job.userId);
    await this.events.publish({
      id: `wf-response-${Date.now()}`,
      type: 'workflow.response.generated',
      tenantId: job.organizationId,
      userId: job.userId,
      data: { channel: job.channel, externalUserId: job.externalUserId, response: text },
      timestamp: new Date(),
      correlationId: job.correlationId,
      version: 1,
      metadata: { environment: process.env['NODE_ENV'] ?? 'development', service: 'workflow-engine' },
    });
  }

  private toGatewayTask(task?: string): GatewayTask {
    if (task === 'video_generation') return GatewayTask.VIDEO_SCRIPT;
    if (task === 'image_generation') return GatewayTask.IMAGE_GENERATION;
    if (task === 'audio_generation') return GatewayTask.AUDIO_TRANSCRIPTION;
    if (task === 'billing_lookup') return GatewayTask.BUSINESS_INSIGHTS;
    return GatewayTask.CHAT;
  }
}
