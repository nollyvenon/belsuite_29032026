import { BadRequestException, Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { Public } from '../common/decorators/public.decorator';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { ChannelAdapterService } from './services/channel-adapter.service';

@Controller('api/v1/orchestration/webhooks')
@Public()
export class OrchestrationWebhooksController {
  constructor(
    private readonly engine: WorkflowEngineService,
    private readonly adapters: ChannelAdapterService,
    private readonly config: ConfigService,
  ) {}

  @Post('telegram')
  async telegram(
    @Body() payload: any,
    @Headers('x-webhook-secret') secret?: string,
    @Headers('x-telegram-bot-api-secret-token') telegramSecretToken?: string,
  ) {
    this.assertGenericWebhookSecret(secret, 'CHANNEL_WEBHOOK_SECRET');
    this.assertTelegramSecret(telegramSecretToken);
    const normalized = this.adapters.normalizeTelegram(payload);
    if (!normalized) throw new BadRequestException('Invalid telegram payload');

    const correlationId = `tg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.engine.start({
      organizationId: normalized.organizationId,
      externalUserId: normalized.externalUserId,
      channel: normalized.channel,
      correlationId,
      message: normalized.message,
      locale: normalized.locale,
      metadata: normalized.metadata,
    });
    return { ok: true, correlationId };
  }

  @Post('whatsapp')
  async whatsapp(
    @Body() payload: any,
    @Req() req: Request,
    @Headers('x-webhook-secret') secret?: string,
    @Headers('x-twilio-signature') twilioSignature?: string,
    @Headers('x-hub-signature-256') metaSignature?: string,
  ) {
    this.assertGenericWebhookSecret(secret, 'CHANNEL_WEBHOOK_SECRET');
    this.assertWhatsappProviderSignature(req, payload, twilioSignature, metaSignature);
    const normalized = this.adapters.normalizeWhatsapp(payload);
    if (!normalized) throw new BadRequestException('Invalid whatsapp payload');

    const correlationId = `wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.engine.start({
      organizationId: normalized.organizationId,
      externalUserId: normalized.externalUserId,
      channel: normalized.channel,
      correlationId,
      message: normalized.message,
      locale: normalized.locale,
      metadata: normalized.metadata,
    });
    return { ok: true, correlationId };
  }

  @Get('whatsapp/meta/verify')
  verifyMetaWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token && expected && token === expected) {
      return challenge ?? 'ok';
    }
    throw new BadRequestException('Webhook verification failed');
  }

  private assertGenericWebhookSecret(received: string | undefined, envKey: string) {
    const expected = this.config.get<string>(envKey);
    if (!expected) return;
    if (!received || received !== expected) {
      throw new BadRequestException('Invalid webhook secret');
    }
  }

  private assertTelegramSecret(received: string | undefined) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET_TOKEN');
    if (!expected) return;
    if (!received || received !== expected) {
      throw new BadRequestException('Invalid Telegram webhook secret token');
    }
  }

  private assertWhatsappProviderSignature(
    req: Request,
    payload: any,
    twilioSignature?: string,
    metaSignature?: string,
  ) {
    const rawBody = (req as any).rawBody
      ? String((req as any).rawBody)
      : JSON.stringify(payload ?? {});

    // Twilio signature verification (if configured and signature present)
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (twilioToken && twilioSignature) {
      const validTwilio = this.verifyTwilioSignature(req, payload, twilioSignature, twilioToken);
      if (!validTwilio) {
        throw new BadRequestException('Invalid Twilio webhook signature');
      }
      return;
    }

    // Meta WhatsApp signature verification (if configured and signature present)
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (appSecret && metaSignature) {
      const validMeta = this.verifyMetaSignature(rawBody, metaSignature, appSecret);
      if (!validMeta) {
        throw new BadRequestException('Invalid WhatsApp Meta webhook signature');
      }
      return;
    }
  }

  private verifyMetaSignature(rawBody: string, signatureHeader: string, appSecret: string) {
    const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private verifyTwilioSignature(
    req: Request,
    body: Record<string, any>,
    signature: string,
    authToken: string,
  ) {
    const protocol = req.headers['x-forwarded-proto']?.toString() || req.protocol;
    const host = req.headers['x-forwarded-host']?.toString() || req.get('host') || '';
    const url = `${protocol}://${host}${req.originalUrl}`;
    const sortedKeys = Object.keys(body ?? {}).sort();
    let data = url;
    for (const key of sortedKeys) {
      const value = body[key];
      data += key + (value === undefined || value === null ? '' : String(value));
    }
    const digest = crypto.createHmac('sha1', authToken).update(data).digest('base64');
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
