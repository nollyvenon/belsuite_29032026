import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SocialWebhookService {
  private readonly logger = new Logger(SocialWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emit(orgId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        OR: [
          { events: { has: event } },
          { events: { has: 'social.*' } },
          { events: { has: '*' } },
        ],
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString();

    await Promise.all(
      webhooks.map(async (webhook) => {
        const body = JSON.stringify({ event, timestamp, payload });
        const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');

        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-belsuite-event': event,
              'x-belsuite-signature': signature,
              'x-belsuite-timestamp': timestamp,
            },
            body,
          });

          if (!response.ok) {
            throw new Error(`Webhook responded with ${response.status}`);
          }

          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: { failureCount: 0, lastFailedAt: null },
          });
        } catch (error) {
          this.logger.warn(
            `Scheduler webhook failed for ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );

          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              failureCount: { increment: 1 },
              lastFailedAt: new Date(),
            },
          });
        }
      }),
    );
  }
}