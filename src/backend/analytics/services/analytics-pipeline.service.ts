import { Injectable } from '@nestjs/common';
import { TrackAnalyticsEventDto } from '../dto/analytics.dto';

@Injectable()
export class AnalyticsPipelineService {
  normalizeEvent(
    organizationId: string,
    userId: string | null,
    dto: TrackAnalyticsEventDto,
  ) {
    const properties = {
      ...(dto.properties ?? {}),
      entityType: dto.entityType,
      entityId: dto.entityId,
      sessionId: dto.sessionId,
      source: dto.source,
      medium: dto.medium,
      campaign: dto.campaign,
      channel: dto.channel,
      value: dto.value,
      sourceModule: dto.channel ?? dto.source,
      normalizedAt: new Date().toISOString(),
    };

    return {
      organizationId,
      userId,
      contentId: dto.contentId,
      eventType: this.normalizeEventType(dto.eventType),
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      properties: JSON.stringify(this.compactObject(properties)),
    };
  }

  parseProperties(properties?: string | null): Record<string, unknown> {
    if (!properties) return {};
    try {
      return JSON.parse(properties) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  isViewEvent(eventType: string) {
    const normalized = this.normalizeEventType(eventType);
    return normalized.includes('VIEW') || normalized.includes('IMPRESSION') || normalized.includes('PLAY');
  }

  isEngagementEvent(eventType: string) {
    const normalized = this.normalizeEventType(eventType);
    return [
      'LIKE',
      'COMMENT',
      'SHARE',
      'SAVE',
      'CLICK',
      'DOWNLOAD',
      'SUBMIT',
      'REACTION',
    ].some((token) => normalized.includes(token));
  }

  private normalizeEventType(eventType: string) {
    return eventType.trim().replace(/[-\s]+/g, '_').toUpperCase();
  }

  private compactObject(input: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
  }
}