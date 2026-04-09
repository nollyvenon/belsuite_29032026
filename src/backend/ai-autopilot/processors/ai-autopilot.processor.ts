import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AIAutopilotService } from '../ai-autopilot.service';
import { Inject, forwardRef } from '@nestjs/common';

export const AI_AUTOPILOT_QUEUE = 'ai-autopilot';

export interface AIAutopilotJobPayload {
  type: 'run-policy';
  organizationId: string;
  userId: string;
  runId: string;
  policyId?: string;
  reason?: string;
}

@Processor(AI_AUTOPILOT_QUEUE, { concurrency: 4 })
export class AIAutopilotProcessor extends WorkerHost {
  private readonly logger = new Logger(AIAutopilotProcessor.name);

  constructor(@Inject(forwardRef(() => AIAutopilotService)) private readonly autopilotService: AIAutopilotService) {
    super();
  }

  async process(job: Job<AIAutopilotJobPayload>): Promise<void> {
    if (job.data.type !== 'run-policy') {
      throw new Error(`Unsupported ai-autopilot job type: ${job.data.type}`);
    }

    this.logger.log(`Executing autopilot run ${job.data.runId} for org ${job.data.organizationId}`);

    await this.autopilotService.executeRun(
      job.data.organizationId,
      job.data.userId,
      job.data.runId,
      job.data.policyId,
      job.data.reason,
    );
  }
}
