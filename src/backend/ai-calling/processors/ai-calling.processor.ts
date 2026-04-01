import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { CallingProviderService } from '../services/calling-provider.service';

export const AI_CALLING_QUEUE = 'ai-calling';

export interface AICallingJobPayload {
  type: 'start-call' | 'transcribe-recording';
  organizationId: string;
  userId?: string;
  callId: string;
  providerCallSid?: string;
  recordingSid?: string;
  recordingUrl?: string;
}

@Processor(AI_CALLING_QUEUE, { concurrency: 8 })
export class AICallingProcessor extends WorkerHost {
  private readonly logger = new Logger(AICallingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerService: CallingProviderService,
    @InjectQueue(AI_CALLING_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<AICallingJobPayload>): Promise<void> {
    if (job.data.type === 'start-call') {
      await this.handleStartCall(job);
      return;
    }

    if (job.data.type === 'transcribe-recording') {
      await this.handleTranscribeRecording(job);
      return;
    }

    throw new Error(`Unknown ai-calling job type: ${job.data.type}`);
  }

  private async handleStartCall(job: Job<AICallingJobPayload>) {
    const callEvent = await this.prisma.analyticsEvent.findFirst({
      where: {
        id: job.data.callId,
        organizationId: job.data.organizationId,
        eventType: 'ai.call.created',
      },
    });

    if (!callEvent) {
      throw new Error('Call event not found');
    }

    const props = this.parse(callEvent.properties);
    const result = await this.providerService.startOutboundCall({
      organizationId: job.data.organizationId,
      callId: job.data.callId,
      to: props.lead?.phone,
      script: props.openingScript,
      metadata: props,
    });

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: job.data.organizationId,
        userId: job.data.userId,
        eventType: 'ai.call.dispatched',
        properties: JSON.stringify({
          callId: job.data.callId,
          provider: result.provider,
          status: result.status,
          providerCallSid: result.providerCallSid,
          error: result.error,
          dispatchedAt: new Date().toISOString(),
        }),
      },
    });

    this.logger.log(`Call ${job.data.callId} dispatched with status ${result.status}`);
  }

  private async handleTranscribeRecording(job: Job<AICallingJobPayload>) {
    if (!job.data.recordingUrl) {
      throw new Error('Missing recording URL');
    }

    const result = await this.providerService.transcribeRecording(
      job.data.recordingUrl,
      job.data.recordingSid,
    );

    const call = await this.prisma.analyticsEvent.findFirst({
      where: {
        id: job.data.callId,
        organizationId: job.data.organizationId,
        eventType: 'ai.call.created',
      },
    });

    if (!call) {
      throw new Error('Call not found while transcribing');
    }

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: call.organizationId,
        userId: call.userId,
        eventType: 'ai.call.recording.transcribed',
        properties: JSON.stringify({
          callId: job.data.callId,
          recordingSid: job.data.recordingSid,
          recordingUrl: job.data.recordingUrl,
          transcript: result.transcript,
          language: result.language,
          confidence: result.confidence,
          transcribedAt: new Date().toISOString(),
        }),
      },
    });
  }

  private parse(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
