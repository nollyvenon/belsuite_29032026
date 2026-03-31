import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrackAnalyticsEventDto } from '../dto/analytics.dto';
import { AnalyticsPipelineService } from './analytics-pipeline.service';

@Injectable()
export class AnalyticsTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: AnalyticsPipelineService,
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

    return {
      id: event.id,
      eventType: event.eventType,
      trackedAt: event.timestamp,
    };
  }
}