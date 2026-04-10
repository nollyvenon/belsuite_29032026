/**
 * WebhookListenerService
 *
 * Receives inbound webhooks from all providers.
 * Verifies signatures, persists the event, and dispatches to the correct handler.
 *
 * Each provider has its own signature algorithm:
 *   Google       — no signature (uses push via verified domain or Pub/Sub)
 *   Facebook     — X-Hub-Signature-256 (HMAC-SHA256 of body with app secret)
 *   Twitter      — X-Twitter-Webhooks-Signature (HMAC-SHA256 base64)
 *   LinkedIn     — no signature (IP allowlist recommended)
 *   TikTok       — no official signature
 *   WhatsApp     — X-Hub-Signature-256 (same as Facebook, shared infra)
 *   Telegram     — verified via secret_token in header
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PrismaService }      from '../../database/prisma.service';
import { WebhookEvent, IntegrationProvider } from '../types/integration.types';
import * as crypto from 'crypto';

@Injectable()
export class WebhookListenerService {
  private readonly logger = new Logger(WebhookListenerService.name);

  // Event handlers registered by provider services
  private handlers = new Map<string, (event: WebhookEvent) => Promise<void>>();

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {}

  // ── Handler registration ───────────────────────────────────────────────

  registerHandler(
    key:     string,  // e.g. "FACEBOOK:messages"
    handler: (event: WebhookEvent) => Promise<void>,
  ): void {
    this.handlers.set(key, handler);
    this.logger.log(`Webhook handler registered: ${key}`);
  }

  // ── Inbound processing ─────────────────────────────────────────────────

  async process(
    provider:        IntegrationProvider,
    rawBody:         string,
    headers:         Record<string, string>,
    organizationId?: string,
    connectionId?:   string,
  ): Promise<{ ok: boolean; eventType?: string }> {
    const signatureValid = this.verifySignature(provider, rawBody, headers);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      this.logger.warn(`Non-JSON webhook from ${provider}`);
      payload = { raw: rawBody };
    }

    const eventType = this.extractEventType(provider, payload);

    // Log to DB
    const log = await this.prisma.incomingWebhookLog.create({
      data: {
        provider,
        eventType,
        payload:        payload as any,
        headers:        headers as any,
        signatureValid,
        connectionId:   connectionId ?? null,
        organizationId: organizationId ?? null,
        processed:      false,
      },
    });

    // Dispatch to handler
    const handlerKey = `${provider}:${eventType}`;
    const handler    = this.handlers.get(handlerKey) ?? this.handlers.get(`${provider}:*`);

    if (handler) {
      try {
        await handler({
          provider,
          eventType,
          connectionId,
          organizationId,
          payload,
          receivedAt: new Date(),
        });

        await this.prisma.incomingWebhookLog.update({
          where: { id: log.id },
          data:  { processed: true },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Webhook handler error [${handlerKey}]: ${msg}`);
        await this.prisma.incomingWebhookLog.update({
          where: { id: log.id },
          data:  { processingError: msg },
        });
      }
    }

    return { ok: true, eventType };
  }

  // ── Facebook webhook verification (GET challenge) ──────────────────────

  verifyFacebookChallenge(
    mode:      string,
    token:     string,
    challenge: string,
  ): string | null {
    const verifyToken = this.config.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    return null;
  }

  // ── Telegram webhook setup ─────────────────────────────────────────────

  async setTelegramWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          url:          webhookUrl,
          secret_token: this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '',
          allowed_updates: ['message', 'callback_query', 'my_chat_member'],
        }),
      },
    );
    const data = await res.json() as any;
    return data.ok === true;
  }

  // ── Query ──────────────────────────────────────────────────────────────

  async getRecentEvents(
    provider?:    IntegrationProvider,
    orgId?:       string,
    limit = 50,
  ) {
    return this.prisma.incomingWebhookLog.findMany({
      where: {
        ...(provider ? { provider } : {}),
        ...(orgId    ? { organizationId: orgId } : {}),
      },
      orderBy: { receivedAt: 'desc' },
      take:    limit,
    });
  }

  // ── Signature verification ─────────────────────────────────────────────

  private verifySignature(
    provider: IntegrationProvider,
    rawBody:  string,
    headers:  Record<string, string>,
  ): boolean {
    try {
      switch (provider) {
        case 'FACEBOOK':
        case 'WHATSAPP': {
          const secret = this.config.get<string>('FACEBOOK_APP_SECRET') ?? '';
          const sig    = headers['x-hub-signature-256']?.replace('sha256=', '') ?? '';
          const expected = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
          return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
        }
        case 'TWITTER': {
          const secret = this.config.get<string>('TWITTER_CONSUMER_SECRET') ?? '';
          const sig    = headers['x-twitter-webhooks-signature'] ?? '';
          const expected = 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('base64');
          return sig === expected;
        }
        case 'TELEGRAM': {
          const secret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '';
          const token  = headers['x-telegram-bot-api-secret-token'] ?? '';
          return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
        }
        default:
          return true; // Providers without signatures (Google, LinkedIn, TikTok)
      }
    } catch {
      return false;
    }
  }

  private extractEventType(provider: IntegrationProvider, payload: any): string {
    switch (provider) {
      case 'FACEBOOK':
      case 'WHATSAPP':
        return payload.object ?? payload.entry?.[0]?.changes?.[0]?.field ?? 'event';
      case 'TWITTER':
        if (payload.direct_message_events)   return 'direct_message';
        if (payload.tweet_create_events)     return 'tweet_create';
        if (payload.favorite_events)         return 'favorite';
        if (payload.follow_events)           return 'follow';
        return 'event';
      case 'TELEGRAM':
        if (payload.message)                 return 'message';
        if (payload.callback_query)          return 'callback_query';
        if (payload.my_chat_member)          return 'my_chat_member';
        return 'event';
      case 'LINKEDIN':
        return payload.action ?? 'event';
      default:
        return 'event';
    }
  }
}
