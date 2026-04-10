import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ORCHESTRATION_QUEUE, OrchestrationJobPayload } from '../orchestration.types';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { WorkflowStorageService } from '../services/workflow-storage.service';

@Processor(ORCHESTRATION_QUEUE, { concurrency: 20 })
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(
    private readonly engine: WorkflowEngineService,
    private readonly storage: WorkflowStorageService,
  ) {
    super();
  }

  async process(job: Job<OrchestrationJobPayload>): Promise<void> {
    this.logger.debug(`workflow stage=${job.data.stage} correlation=${job.data.correlationId}`);
    try {
      await this.engine.runStage(job.data);
    } catch (error) {
      await this.storage.logStage(
        job.data.organizationId,
        'workflow.stage.failed',
        job.data.correlationId,
        {
          stage: job.data.stage,
          error: error instanceof Error ? error.message : 'unknown',
        },
        job.data.userId,
      );
      throw error;
    }
  }
}
