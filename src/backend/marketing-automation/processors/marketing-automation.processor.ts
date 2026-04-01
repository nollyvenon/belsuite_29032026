import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ChannelDispatchService, MarketingDispatchPayload } from '../services/channel-dispatch.service';

export const MARKETING_AUTOMATION_QUEUE = 'marketing-automation';

export interface MarketingAutomationJobPayload {
  type: 'dispatch-step';
  organizationId: string;
  userId?: string;
  campaignId: string;
  campaignName: string;
  runId: string;
  stepOrder: number;
  stepId: string;
  channel: MarketingDispatchPayload['channel'];
  subject?: string;
  message: string;
  contact: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Processor(MARKETING_AUTOMATION_QUEUE, { concurrency: 10 })
export class MarketingAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketingAutomationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: ChannelDispatchService,
    @InjectQueue(MARKETING_AUTOMATION_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<MarketingAutomationJobPayload>): Promise<void> {
    if (job.data.type !== 'dispatch-step') {
      throw new Error(`Unknown marketing automation job type: ${job.data.type}`);
    }

    const result = await this.dispatchService.dispatch({
      organizationId: job.data.organizationId,
      userId: job.data.userId,
      campaignId: job.data.campaignId,
      runId: job.data.runId,
      channel: job.data.channel,
      contact: job.data.contact,
      subject: job.data.subject,
      message: job.data.message,
      metadata: job.data.metadata,
    });

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: job.data.organizationId,
        userId: job.data.userId,
        eventType: 'marketing.automation.message_sent',
        properties: JSON.stringify({
          campaignId: job.data.campaignId,
          campaignName: job.data.campaignName,
          runId: job.data.runId,
          stepOrder: job.data.stepOrder,
          stepId: job.data.stepId,
          channel: job.data.channel,
          contact: job.data.contact,
          status: result.status,
          provider: result.provider,
          recipient: (result as Record<string, unknown>).recipient,
          providerMessageId: (result as Record<string, unknown>).providerMessageId,
          error: (result as Record<string, unknown>).error,
          metadata: job.data.metadata,
          dispatchedAt: new Date().toISOString(),
        }),
      },
    });

    this.logger.log(
      `Campaign ${job.data.campaignId} step ${job.data.stepOrder} ${job.data.channel} -> ${String((result as Record<string, unknown>).status)}`,
    );
  }
}
