import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NormalizedInboundMessage {
  organizationId: string;
  channel: 'telegram' | 'whatsapp';
  externalUserId: string;
  message: string;
  locale?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ChannelAdapterService {
  private readonly logger = new Logger(ChannelAdapterService.name);

  constructor(private readonly config: ConfigService) {}

  normalizeTelegram(payload: any): NormalizedInboundMessage | null {
    const msg = payload?.message ?? payload?.edited_message ?? null;
    if (!msg?.text && !msg?.caption) return null;

    const organizationId =
      payload?.organizationId ||
      msg?.organizationId ||
      this.config.get<string>('TELEGRAM_DEFAULT_ORGANIZATION_ID');
    if (!organizationId) {
      this.logger.warn('Telegram payload dropped: organizationId not resolvable');
      return null;
    }

    return {
      organizationId,
      channel: 'telegram',
      externalUserId: `telegram:${msg.from?.id ?? 'unknown'}`,
      message: String(msg.text ?? msg.caption ?? ''),
      locale: msg.from?.language_code,
      metadata: {
        chatId: msg.chat?.id,
        username: msg.from?.username,
        raw: payload,
      },
    };
  }

  normalizeWhatsapp(payload: any): NormalizedInboundMessage | null {
    const twilioBody = payload?.Body;
    const twilioFrom = payload?.From ?? payload?.WaId;

    if (twilioBody && twilioFrom) {
      const organizationId =
        payload?.organizationId ||
        this.config.get<string>('WHATSAPP_DEFAULT_ORGANIZATION_ID');
      if (!organizationId) return null;
      return {
        organizationId,
        channel: 'whatsapp',
        externalUserId: `whatsapp:${String(twilioFrom).replace('whatsapp:', '')}`,
        message: String(twilioBody),
        metadata: {
          provider: 'twilio',
          profileName: payload?.ProfileName,
          raw: payload,
        },
      };
    }

    const metaMessage = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const metaText = metaMessage?.text?.body;
    if (metaText) {
      const organizationId =
        payload?.organizationId ||
        this.config.get<string>('WHATSAPP_DEFAULT_ORGANIZATION_ID');
      if (!organizationId) return null;
      return {
        organizationId,
        channel: 'whatsapp',
        externalUserId: `whatsapp:${metaMessage.from ?? 'unknown'}`,
        message: String(metaText),
        metadata: {
          provider: 'meta',
          messageId: metaMessage.id,
          raw: payload,
        },
      };
    }

    return null;
  }
}
