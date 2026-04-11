import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IntegrationProvider, IntegrationDeliveryJob, IntegrationEventTrigger } from '../types/integration.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventBus } from '../../common/events/event.bus';

@Injectable()
export class IntegrationEventsService {
  private readonly logger = new Logger(IntegrationEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('integration-delivery') private readonly queue: Queue,
    private readonly eventBus: EventBus,
  ) {}

  async enqueueDelivery(input: Omit<IntegrationDeliveryJob, 'id' | 'status' | 'attempts'>) {
    const job = await this.prisma.billingConfig.create({
      data: {
        key: `integration_job:${input.organizationId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        value: JSON.stringify({
          ...input,
          status: 'PENDING',
          attempts: 0,
        }),
        description: `Queued integration delivery for ${input.provider}`,
      },
    });
    await this.queue.add(
      'delivery',
      {
        organizationId: input.organizationId,
        provider: input.provider,
        connectionId: input.connectionId ?? null,
        eventType: input.eventType,
        payload: input.payload,
        maxAttempts: input.maxAttempts,
        nextRetryAt: input.nextRetryAt ?? null,
      },
      {
        attempts: input.maxAttempts,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
    await this.eventBus.publish({
      id: `integration-queued-${job.id}`,
      type: 'integration.delivery.queued',
      tenantId: input.organizationId,
      data: {
        provider: input.provider,
        eventType: input.eventType,
        payload: input.payload,
      },
      timestamp: new Date(),
      correlationId: job.id,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'integrations',
      },
    });
    this.logger.log(`Integration job queued for ${input.provider} (${input.eventType})`);
    return job;
  }

  async triggerEvent(input: IntegrationEventTrigger) {
    const jobs = [];
    for (const channel of input.channels) {
      const queued = await this.enqueueDelivery({
        organizationId: input.organizationId,
        provider: channel.provider as IntegrationProvider,
        connectionId: channel.connectionId ?? undefined,
        eventType: input.eventType,
        payload: {
          ...input.payload,
          channel: channel.channel ?? undefined,
        },
        maxAttempts: 5,
        nextRetryAt: null,
      });
      jobs.push(queued);
    }
    await this.eventBus.publish({
      id: `integration-fanout-${Date.now()}`,
      type: 'integration.event.triggered',
      tenantId: input.organizationId,
      data: {
        eventType: input.eventType,
        channels: input.channels,
        payload: input.payload,
      },
      timestamp: new Date(),
      correlationId: Date.now().toString(),
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'integrations',
      },
    });
    return { queued: jobs.length };
  }

  async listDeliveryLogs(organizationId: string, filter?: { provider?: string; eventType?: string; status?: string }) {
    const rows = await this.prisma.billingConfig.findMany({
      where: {
        key: { startsWith: `integration_log:${organizationId}:` },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return rows
      .map((row) => {
        try {
          return JSON.parse(row.value) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .filter((row) => !filter?.provider || String(row.provider ?? '').toUpperCase() === filter.provider.toUpperCase())
      .filter((row) => !filter?.eventType || String(row.eventType ?? '') === filter.eventType)
      .filter((row) => !filter?.status || String(row.status ?? '') === filter.status);
  }

  async listWebhookConfigs(organizationId: string) {
    const rows = await this.prisma.billingConfig.findMany({
      where: {
        key: { startsWith: `integration_webhook:${organizationId}:` },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => JSON.parse(row.value) as Record<string, unknown>);
  }

  async upsertWebhookConfig(organizationId: string, config: Record<string, unknown> & { provider: string }) {
    const key = `integration_webhook:${organizationId}:${config.provider}`;
    await this.prisma.billingConfig.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify(config),
        description: `Webhook config for ${config.provider}`,
      },
      update: {
        value: JSON.stringify(config),
      },
    });
    return config;
  }

  async recordRetry(organizationId: string, provider: IntegrationProvider, eventType: string, payload: Record<string, unknown>, error: string, attempts: number) {
    await this.prisma.billingConfig.create({
      data: {
        key: `integration_retry:${organizationId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        value: JSON.stringify({
          provider,
          eventType,
          payload,
          error,
          attempts,
          retryAt: new Date().toISOString(),
          nextRetryAt: new Date(Date.now() + attempts * 5000).toISOString(),
        }),
        description: `Retry record for ${provider} ${eventType}`,
      },
    });
  }

  async logDeliveryEvent(params: {
    organizationId: string;
    provider: IntegrationProvider;
    eventType: string;
    status: 'SUCCESS' | 'FAILED' | 'RETRYING';
    attempts: number;
    payload: Record<string, unknown>;
    error?: string;
  }) {
    await this.prisma.billingConfig.create({
      data: {
        key: `integration_log:${params.organizationId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        value: JSON.stringify({
          ...params,
          loggedAt: new Date().toISOString(),
        }),
        description: `Integration ${params.provider} ${params.status} log for ${params.eventType}`,
      },
    });

    await this.eventBus.publish({
      id: `integration-log-${Date.now()}`,
      type: `integration.delivery.${params.status.toLowerCase()}`,
      tenantId: params.organizationId,
      data: {
        provider: params.provider,
        eventType: params.eventType,
        status: params.status,
        attempts: params.attempts,
        error: params.error ?? null,
      },
      timestamp: new Date(),
      correlationId: `${params.organizationId}-${params.eventType}-${Date.now()}`,
      version: 1,
      metadata: {
        environment: process.env['NODE_ENV'] ?? 'development',
        service: 'integrations',
      },
    });
  }

  async getRetryPolicy(organizationId: string) {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: `integration_retry_policy:${organizationId}` },
    });
    return row ? JSON.parse(row.value) : {
      enabled: true,
      maxAttempts: 5,
      retryDelayMs: 5000,
      retryableStatuses: ['FAILED', 'RETRYING'],
    };
  }

  async updateRetryPolicy(organizationId: string, policy: Record<string, unknown>) {
    await this.prisma.billingConfig.upsert({
      where: { key: `integration_retry_policy:${organizationId}` },
      create: {
        key: `integration_retry_policy:${organizationId}`,
        value: JSON.stringify(policy),
        description: 'Integration retry policy',
      },
      update: {
        value: JSON.stringify(policy),
      },
    });
    return policy;
  }
}
