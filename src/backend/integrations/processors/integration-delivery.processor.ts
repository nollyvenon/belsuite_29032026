import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IntegrationEventsService } from '../services/integration-events.service';
import { SlackService } from '../providers/communication/slack.service';
import { ZapierService } from '../providers/communication/zapier.service';
import { EmailProviderFactory } from '../../email/providers/email.provider.factory';
import { SmsService } from '../providers/communication/sms.service';

@Injectable()
@Processor('integration-delivery')
export class IntegrationDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(IntegrationDeliveryProcessor.name);

  constructor(
    private readonly events: IntegrationEventsService,
    private readonly slack: SlackService,
    private readonly zapier: ZapierService,
    private readonly emailFactory: EmailProviderFactory,
    private readonly sms: SmsService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const payload = job.data as {
      organizationId: string;
      provider: string;
      eventType: string;
      payload: Record<string, unknown>;
      connectionId?: string | null;
      maxAttempts?: number;
    };

    try {
      if (payload.provider === 'SLACK') {
        await this.slack.send({
          channel: String(payload.payload.channel ?? '#alerts'),
          text: String(payload.payload.text ?? payload.eventType),
          metadata: payload.payload,
        });
      } else if (payload.provider === 'ZAPIER') {
        await this.zapier.trigger({
          hookName: payload.eventType,
          payload: payload.payload,
          organizationId: payload.organizationId,
        });
      } else if (String(payload.provider).startsWith('EMAIL_')) {
        const providerName = String(payload.provider).replace('EMAIL_', '').toLowerCase() as any;
        const provider = this.emailFactory.getProvider(providerName);
        const recipient = String(payload.payload.email ?? payload.payload.to ?? '');
        const subject = String(payload.payload.subject ?? payload.eventType);
        const text = String(payload.payload.text ?? payload.payload.message ?? '');
        const response = 'sendEmail' in provider
          ? await provider.sendEmail({ to: { email: recipient }, subject, textContent: text, htmlContent: `<p>${text}</p>`, metadata: payload.payload })
          : await provider.send({ to: recipient, subject, text, metadata: payload.payload });
        if (!response || ((response as any).success === false)) {
          throw new Error((response as any)?.error || 'Email delivery failed');
        }
      } else if (String(payload.provider).startsWith('SMS_')) {
        const to = String(payload.payload.to ?? payload.payload.phone ?? '');
        const body = String(payload.payload.body ?? payload.payload.message ?? '');
        await this.sms.send({
          to,
          body,
          provider: String(payload.provider).replace('SMS_', '') as any,
        });
      }

      await this.events.logDeliveryEvent({
        organizationId: payload.organizationId,
        provider: payload.provider as any,
        eventType: payload.eventType,
        status: 'SUCCESS',
        attempts: job.attemptsMade + 1,
        payload: payload.payload,
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.events.logDeliveryEvent({
        organizationId: payload.organizationId,
        provider: payload.provider as any,
        eventType: payload.eventType,
        status: 'FAILED',
        attempts: job.attemptsMade + 1,
        payload: payload.payload,
        error: message,
      });
      await this.events.recordRetry(
        payload.organizationId,
        payload.provider as any,
        payload.eventType,
        payload.payload,
        message,
        job.attemptsMade + 1,
      );
      this.logger.warn(`Integration delivery failed for ${payload.provider}: ${message}`);
      throw error;
    }
  }
}
