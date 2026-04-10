import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkflowStorageService {
  constructor(private readonly prisma: PrismaService) {}

  async logStage(
    organizationId: string,
    eventType: string,
    correlationId: string,
    payload: Record<string, any>,
    userId?: string,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId,
        eventType,
        properties: JSON.stringify({ correlationId, ...payload }),
      },
    });
  }

  async getWorkflowTrace(organizationId: string, correlationId: string) {
    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: { startsWith: 'workflow.' },
        properties: { contains: correlationId },
      },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map((r) => ({
      eventType: r.eventType,
      timestamp: r.timestamp,
      properties: this.safeParse(r.properties),
    }));
  }

  private safeParse(raw?: string | null) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
