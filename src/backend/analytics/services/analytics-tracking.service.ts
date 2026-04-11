import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrackAnalyticsEventDto } from '../dto/analytics.dto';
import { AnalyticsPipelineService } from './analytics-pipeline.service';
import { EventBus } from '../../common/events/event.bus';

@Injectable()
export class AnalyticsTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: AnalyticsPipelineService,
    private readonly eventBus: EventBus,
  ) {}

  async trackEvent(
    organizationId: string,
    userId: string | null,
    dto: TrackAnalyticsEventDto,
  ) {
    const payload = this.pipeline.normalizeEvent(organizationId, userId, dto);

    const event = await this.prisma.analyticsEvent.create({
      data: payload,
    });

    await this.eventBus.publish({
      id: `analytics-event-emitted-${event.id}`,
      type: 'analytics.event-emitted',
      tenantId: organizationId,
      userId: userId ?? undefined,
      data: {
        eventName: dto.eventType || dto.eventName || event.eventType,
        organizationId,
        properties: dto.properties || {},
      },
      timestamp: event.timestamp,
      correlationId: event.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'analytics',
      },
    });

    return {
      id: event.id,
      eventType: event.eventType,
      trackedAt: event.timestamp,
    };
  }
}