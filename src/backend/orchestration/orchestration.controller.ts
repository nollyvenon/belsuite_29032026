import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { InboundInputDto } from './dto/orchestration.dto';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { WorkflowStorageService } from './services/workflow-storage.service';
import { ORCHESTRATION_QUEUE } from './orchestration.types';

@Controller('api/v1/orchestration')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrchestrationController {
  constructor(
    private readonly engine: WorkflowEngineService,
    private readonly storage: WorkflowStorageService,
    @InjectQueue(ORCHESTRATION_QUEUE) private readonly queue: Queue,
  ) {}

  @Post('input')
  async ingestInput(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: InboundInputDto,
  ) {
    const correlationId = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await this.engine.start({
      organizationId,
      userId,
      externalUserId: dto.externalUserId,
      channel: dto.channel,
      correlationId,
      message: dto.message,
      locale: dto.locale,
      metadata: dto.metadata,
    });
    return { success: true, data: result };
  }

  @Get('trace/:correlationId')
  async trace(
    @Tenant() organizationId: string,
    @Param('correlationId') correlationId: string,
  ) {
    const data = await this.storage.getWorkflowTrace(organizationId, correlationId);
    return { success: true, data };
  }

  @Get('monitoring/queue')
  async queueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);
    return {
      success: true,
      data: { queue: ORCHESTRATION_QUEUE, waiting, active, completed, failed, delayed },
    };
  }
}
