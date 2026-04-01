import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AutomationListQueryDto,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from './dto/automation.dto';

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkflow(organizationId: string, dto: CreateWorkflowDto) {
    const workflow = await this.prisma.workflow.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        trigger: JSON.stringify(dto.trigger ?? {}),
        isActive: dto.isActive ?? false,
        contentId: dto.contentId,
        actions: {
          create: (dto.actions ?? []).map((action) => ({
            order: action.order,
            actionType: action.actionType,
            config: JSON.stringify(action.config ?? {}),
          })),
        },
      },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    return this.mapWorkflow(workflow);
  }

  async listWorkflows(organizationId: string, query: AutomationListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [items, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { actions: { orderBy: { order: 'asc' } } },
      }),
      this.prisma.workflow.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapWorkflow(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWorkflow(organizationId: string, workflowId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, organizationId },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');
    return this.mapWorkflow(workflow);
  }

  async updateWorkflow(organizationId: string, workflowId: string, dto: UpdateWorkflowDto) {
    await this.ensureWorkflowExists(organizationId, workflowId);

    await this.prisma.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id: workflowId },
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.type,
          trigger: dto.trigger ? JSON.stringify(dto.trigger) : undefined,
          isActive: dto.isActive,
          contentId: dto.contentId === null ? null : dto.contentId,
        },
      });

      if (dto.actions) {
        await tx.workflowAction.deleteMany({ where: { workflowId } });
        if (dto.actions.length > 0) {
          await tx.workflowAction.createMany({
            data: dto.actions.map((action) => ({
              workflowId,
              order: action.order,
              actionType: action.actionType,
              config: JSON.stringify(action.config ?? {}),
            })),
          });
        }
      }
    });

    return this.getWorkflow(organizationId, workflowId);
  }

  async deleteWorkflow(organizationId: string, workflowId: string) {
    await this.ensureWorkflowExists(organizationId, workflowId);
    await this.prisma.workflow.delete({ where: { id: workflowId } });
    return { success: true };
  }

  async setWorkflowActive(organizationId: string, workflowId: string, isActive: boolean) {
    await this.ensureWorkflowExists(organizationId, workflowId);

    const workflow = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { isActive },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    return this.mapWorkflow(workflow);
  }

  async executeWorkflow(organizationId: string, workflowId: string, userId?: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, organizationId },
      include: { actions: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');

    const actionResults = workflow.actions.map((action) => {
      const parsedConfig = this.safeJson(action.config);
      return {
        actionId: action.id,
        order: action.order,
        actionType: action.actionType,
        status: 'queued',
        config: parsedConfig,
      };
    });

    await this.prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      executedBy: userId ?? null,
      executedAt: new Date(),
      actionCount: workflow.actions.length,
      actions: actionResults,
    };
  }

  async getAutomationStats(organizationId: string, days = 30) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const workflows = await this.prisma.workflow.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        executionCount: true,
        lastExecutedAt: true,
        updatedAt: true,
      },
      orderBy: { executionCount: 'desc' },
    });

    const executedRecently = workflows.filter(
      (w) => w.lastExecutedAt && w.lastExecutedAt >= since,
    );

    return {
      periodDays: days,
      totals: {
        workflows: workflows.length,
        active: workflows.filter((w) => w.isActive).length,
        inactive: workflows.filter((w) => !w.isActive).length,
        totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
        executedRecently: executedRecently.length,
      },
      topWorkflows: workflows.slice(0, 10).map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        isActive: w.isActive,
        executionCount: w.executionCount,
        lastExecutedAt: w.lastExecutedAt,
      })),
      typeBreakdown: this.groupByType(workflows),
    };
  }

  private async ensureWorkflowExists(organizationId: string, workflowId: string) {
    const exists = await this.prisma.workflow.findFirst({
      where: { id: workflowId, organizationId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('Workflow not found');
  }

  private mapWorkflow(workflow: any) {
    return {
      ...workflow,
      trigger: this.safeJson(workflow.trigger),
      actions: (workflow.actions ?? []).map((action: any) => ({
        ...action,
        config: this.safeJson(action.config),
      })),
    };
  }

  private safeJson(value?: string | null) {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  private groupByType(workflows: Array<{ type: string; executionCount: number }>) {
    const map = new Map<string, { type: string; count: number; executions: number }>();
    for (const workflow of workflows) {
      const row = map.get(workflow.type) ?? { type: workflow.type, count: 0, executions: 0 };
      row.count += 1;
      row.executions += workflow.executionCount;
      map.set(workflow.type, row);
    }
    return Array.from(map.values()).sort((a, b) => b.executions - a.executions);
  }
}
