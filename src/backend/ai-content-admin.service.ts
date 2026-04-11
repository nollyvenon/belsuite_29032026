// Admin controls for AI Content Studio (usage tracking via Prisma AIUsage)

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AIContentAdminService {
  private readonly logger = new Logger(AIContentAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Reserved for per-task model routing configuration */
  async setModelForTask(_taskType: string, _model: string): Promise<void> {
    this.logger.debug('setModelForTask: not persisted yet');
  }

  /** Reserved for tenant token ceilings */
  async setTokenLimit(_tenantId: string, _limit: number): Promise<void> {
    this.logger.debug('setTokenLimit: not persisted yet');
  }

  async trackCost(params: {
    userId: string;
    tenantId: string;
    tokensUsed: number;
    cost: number;
    aiModel: string;
    contentId?: string;
    templateId?: string;
  }) {
    return this.prisma.aIUsage.create({
      data: {
        organizationId: params.tenantId,
        userId: params.userId,
        model: params.aiModel,
        provider: 'studio',
        totalTokens: params.tokensUsed,
        cost: params.cost,
        promptTemplateId: params.templateId,
        contentType: params.contentId,
      },
    });
  }

  async getCostReport(params: { tenantId: string; from: Date; to: Date }) {
    return this.prisma.aIUsage.aggregate({
      where: {
        organizationId: params.tenantId,
        createdAt: { gte: params.from, lte: params.to },
      },
      _sum: { cost: true, totalTokens: true },
    });
  }
}
