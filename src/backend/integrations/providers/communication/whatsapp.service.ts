import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';

const GRAPH   = 'https://graph.facebook.com/v19.0';

export interface WhatsAppTextMessage   { to: string; body: string; previewUrl?: boolean }
export interface WhatsAppMediaMessage  { to: string; type: 'image' | 'video' | 'document' | 'audio'; url: string; caption?: string; filename?: string }
export interface WhatsAppTemplateMessage {
  to:           string;
  templateName: string;
  languageCode: string;
  components?:  any[];
}
export interface WhatsAppInteractiveMessage {
  to:      string;
  type:    'button' | 'list';
  body:    string;
  buttons?: { id: string; title: string }[];
  sections?: { title?: string; rows: { id: string; title: string; description?: string }[] }[];
  header?:   string;
  footer?:   string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly token:         string;

  constructor(private readonly config: ConfigService) {
    this.phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';
    this.token         = this.config.get('WHATSAPP_ACCESS_TOKEN')    ?? '';
  }

  // ── Text ─────────────────────────────────────────────────────────────────

  async sendText(msg: WhatsAppTextMessage): Promise<string> {
    const data = await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to:                msg.to,
      type:              'text',
      text:              { body: msg.body, preview_url: msg.previewUrl ?? false },
    });
    return data.messages?.[0]?.id;
  }

  // ── Media ────────────────────────────────────────────────────────────────

  async sendMedia(msg: WhatsAppMediaMessage): Promise<string> {
    const mediaBlock: any = { link: msg.url };
    if (msg.caption)  mediaBlock.caption  = msg.caption;
    if (msg.filename) mediaBlock.filename = msg.filename;

    const data = await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to:                msg.to,
      type:              msg.type,
      [msg.type]:        mediaBlock,
    });
    return data.messages?.[0]?.id;
  }

  async sendDocument(to: string, url: string, filename: string, caption?: string): Promise<string> {
    return this.sendMedia({ to, type: 'document', url, filename, caption });
  }

  // ── Templates ────────────────────────────────────────────────────────────

  async sendTemplate(msg: WhatsAppTemplateMessage): Promise<string> {
    const data = await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to:                msg.to,
      type:              'template',
      template: {
        name:       msg.templateName,
        language:   { code: msg.languageCode },
        components: msg.components ?? [],
      },
    });
    return data.messages?.[0]?.id;
  }

  // ── Interactive ──────────────────────────────────────────────────────────

  async sendInteractive(msg: WhatsAppInteractiveMessage): Promise<string> {
    const interactive: any = {
      type: msg.type,
      body: { text: msg.body },
    };

    if (msg.header)  interactive.header = { type: 'text', text: msg.header };
    if (msg.footer)  interactive.footer = { text: msg.footer };

    if (msg.type === 'button' && msg.buttons) {
      interactive.action = {
        buttons: msg.buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      };
    } else if (msg.type === 'list' && msg.sections) {
      interactive.action = {
        button:   'Select',
        sections: msg.sections,
      };
    }

    const data = await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to:                msg.to,
      type:              'interactive',
      interactive,
    });
    return data.messages?.[0]?.id;
  }

  // ── Reactions ────────────────────────────────────────────────────────────

  async sendReaction(to: string, messageId: string, emoji: string): Promise<void> {
    await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to,
      type:     'reaction',
      reaction: { message_id: messageId, emoji },
    });
  }

  // ── Mark as Read ─────────────────────────────────────────────────────────

  async markAsRead(messageId: string): Promise<void> {
    await this.apiFetch(`/${this.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      status:            'read',
      message_id:        messageId,
    });
  }

  // ── Media Upload ─────────────────────────────────────────────────────────

  async uploadMedia(buffer: Buffer, mimeType: string): Promise<string> {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([buffer], { type: mimeType }));

    const res = await fetch(`${GRAPH}/${this.phoneNumberId}/media`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body:    form,
    });
    if (!res.ok) throw new Error(`WhatsApp media upload ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.id;
  }

  // ── Webhook Verification ──────────────────────────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    return null;
  }

  // ── Phone Number Info ─────────────────────────────────────────────────────

  async getPhoneNumberInfo(): Promise<any> {
    return this.apiFetch(`/${this.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`, 'GET');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async apiFetch(path: string, method = 'GET', body?: any): Promise<any> {
    const url = `${GRAPH}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization:  `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
    return res.json();
  }
}
