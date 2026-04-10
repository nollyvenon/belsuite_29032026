import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, IEventHandler, DomainEvent } from '../../common/events';

@Injectable()
export class ChannelDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(ChannelDeliveryService.name);

  constructor(
    private readonly events: EventBus,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.events.subscribe('workflow.response.generated', {
      handle: async (event: DomainEvent) => this.handleResponseEvent(event),
    } as IEventHandler);
  }

  private async handleResponseEvent(event: DomainEvent) {
    const channel = String(event.data?.channel ?? '').toLowerCase();
    const externalUserId = String(event.data?.externalUserId ?? '');
    const response = String(event.data?.response ?? '');

    if (!channel || !externalUserId || !response) return;

    if (channel === 'telegram') {
      await this.sendTelegram(externalUserId, response);
      return;
    }
    if (channel === 'whatsapp') {
      await this.sendWhatsapp(externalUserId, response);
      return;
    }
  }

  private async sendTelegram(externalUserId: string, text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = externalUserId.replace('telegram:', '');
    if (!token || !chatId) {
      this.logger.debug('Telegram delivery skipped (missing token/chatId)');
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }

  private async sendWhatsapp(externalUserId: string, text: string) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    if (!accountSid || !authToken || !from) {
      this.logger.debug('WhatsApp delivery skipped (missing Twilio config)');
      return;
    }

    const to = externalUserId.replace('whatsapp:', '');
    const body = new URLSearchParams({
      From: `whatsapp:${from.replace('whatsapp:', '')}`,
      To: `whatsapp:${to}`,
      Body: text,
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }
}
