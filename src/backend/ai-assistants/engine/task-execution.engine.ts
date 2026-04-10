/**
 * Task Execution Engine
 *
 * Async task runner for all AI assistant operations.
 * Persists tasks to AIAssistantTask table, enqueues to BullMQ,
 * and provides status tracking.
 *
 * Processors are registered per-assistantType in the NestJS module.
 * This engine only handles dispatch + lifecycle management.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import {
  AssistantType,
  TaskType,
  TaskStatus,
  SubmittedTask,
} from '../types/assistant.types';

export const ASSISTANT_QUEUE = 'ai-assistant-tasks';

export interface TaskPayload {
  organizationId: string;
  userId?:        string;
  assistantType:  AssistantType;
  taskType:       TaskType;
  data:           Record<string, unknown>;
}

@Injectable()
export class TaskExecutionEngine {
  private readonly logger = new Logger(TaskExecutionEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ASSISTANT_QUEUE) private readonly queue: Queue,
  ) {}

  // ── Submit ─────────────────────────────────────────────────────────────

  async submit(
    payload:     TaskPayload,
    options?: {
      priority?:    number;          // 1 (highest) – 10 (lowest), default 5
      scheduledAt?: Date;            // delay until this time
      jobId?:       string;          // idempotency key
    },
  ): Promise<SubmittedTask> {
    const { organizationId, userId, assistantType, taskType, data } = payload;
    const priority    = options?.priority    ?? 5;
    const scheduledAt = options?.scheduledAt ?? null;

    // Persist to DB first for durability
    const task = await this.prisma.aIAssistantTask.create({
      data: {
        organizationId,
        userId:        userId ?? null,
        assistantType,
        taskType,
        status:        'PENDING',
        priority,
        payload:       data as any,
        scheduledAt,
      },
    });

    // Enqueue to BullMQ
    const delay = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;

    await this.queue.add(
      taskType,
      { taskId: task.id, ...payload },
      {
        priority,
        delay,
        jobId:    options?.jobId ?? task.id,
        attempts: 3,
        backoff:  { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.debug(`Task submitted: ${taskType} (${task.id}) for org ${organizationId}`);

    return {
      taskId:      task.id,
      taskType,
      status:      'PENDING',
      scheduledAt: scheduledAt ?? undefined,
    };
  }

  // ── Lifecycle (called by BullMQ processor) ─────────────────────────────

  async markProcessing(taskId: string): Promise<void> {
    await this.prisma.aIAssistantTask.update({
      where: { id: taskId },
      data:  { status: 'PROCESSING', startedAt: new Date() },
    });
  }

  async markDone(taskId: string, result: Record<string, unknown>): Promise<void> {
    await this.prisma.aIAssistantTask.update({
      where: { id: taskId },
      data:  { status: 'DONE', result: result as any, completedAt: new Date() },
    });
  }

  async markFailed(taskId: string, error: string): Promise<void> {
    await this.prisma.aIAssistantTask.update({
      where: { id: taskId },
      data:  { status: 'FAILED', errorMessage: error.slice(0, 2000), completedAt: new Date() },
    });
  }

  // ── Query ──────────────────────────────────────────────────────────────

  async getStatus(taskId: string): Promise<SubmittedTask | null> {
    const task = await this.prisma.aIAssistantTask.findUnique({ where: { id: taskId } });
    if (!task) return null;
    return {
      taskId:      task.id,
      taskType:    task.taskType as TaskType,
      status:      task.status as TaskStatus,
      scheduledAt: task.scheduledAt ?? undefined,
    };
  }

  async getOrgTasks(
    organizationId: string,
    filters?: { assistantType?: AssistantType; status?: TaskStatus; limit?: number },
  ) {
    return this.prisma.aIAssistantTask.findMany({
      where: {
        organizationId,
        ...(filters?.assistantType && { assistantType: filters.assistantType }),
        ...(filters?.status        && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
      take:    filters?.limit ?? 50,
    });
  }

  async cancel(taskId: string): Promise<void> {
    await this.prisma.aIAssistantTask.update({
      where: { id: taskId },
      data:  { status: 'CANCELLED' },
    });
    // Best-effort removal from queue
    const job = await this.queue.getJob(taskId);
    if (job) await job.remove().catch(() => {});
  }
}
