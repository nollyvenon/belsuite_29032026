import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';

const BASE = 'https://api.telegram.org/bot';

export interface TelegramSendOptions {
  chatId:             string | number;
  text:               string;
  parseMode?:         'HTML' | 'MarkdownV2' | 'Markdown';
  replyToMessageId?:  number;
  disablePreview?:    boolean;
  replyMarkup?:       any;  // InlineKeyboardMarkup | ReplyKeyboardMarkup | etc.
}

export interface TelegramPhotoOptions {
  chatId:   string | number;
  photoUrl: string;
  caption?: string;
  parseMode?: 'HTML' | 'MarkdownV2';
}

export interface TelegramDocumentOptions {
  chatId:       string | number;
  documentUrl:  string;
  caption?:     string;
  filename?:    string;
}

@Injectable()
export class TelegramService {
  private readonly logger   = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get('TELEGRAM_BOT_TOKEN') ?? '';
  }

  // ── Webhook management ───────────────────────────────────────────────────

  async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    const body: any = {
      url:              webhookUrl,
      allowed_updates:  ['message', 'callback_query', 'inline_query', 'my_chat_member'],
      drop_pending_updates: true,
    };
    if (secretToken) body.secret_token = secretToken;

    const data = await this.call('setWebhook', body);
    return data.result === true;
  }

  async deleteWebhook(): Promise<void> {
    await this.call('deleteWebhook', { drop_pending_updates: true });
  }

  async getWebhookInfo(): Promise<any> {
    return (await this.call('getWebhookInfo')).result;
  }

  // ── Send messages ────────────────────────────────────────────────────────

  async sendMessage(opts: TelegramSendOptions): Promise<any> {
    return (await this.call('sendMessage', {
      chat_id:              opts.chatId,
      text:                 opts.text,
      parse_mode:           opts.parseMode,
      disable_web_page_preview: opts.disablePreview,
      reply_to_message_id:  opts.replyToMessageId,
      reply_markup:         opts.replyMarkup,
    })).result;
  }

  async sendPhoto(opts: TelegramPhotoOptions): Promise<any> {
    return (await this.call('sendPhoto', {
      chat_id:    opts.chatId,
      photo:      opts.photoUrl,
      caption:    opts.caption,
      parse_mode: opts.parseMode,
    })).result;
  }

  async sendDocument(opts: TelegramDocumentOptions): Promise<any> {
    return (await this.call('sendDocument', {
      chat_id:    opts.chatId,
      document:   opts.documentUrl,
      caption:    opts.caption,
    })).result;
  }

  async sendVideo(chatId: string | number, videoUrl: string, caption?: string): Promise<any> {
    return (await this.call('sendVideo', { chat_id: chatId, video: videoUrl, caption })).result;
  }

  async sendAudio(chatId: string | number, audioUrl: string, caption?: string): Promise<any> {
    return (await this.call('sendAudio', { chat_id: chatId, audio: audioUrl, caption })).result;
  }

  async sendLocation(chatId: string | number, latitude: number, longitude: number): Promise<any> {
    return (await this.call('sendLocation', { chat_id: chatId, latitude, longitude })).result;
  }

  // ── Media group ──────────────────────────────────────────────────────────

  async sendMediaGroup(chatId: string | number, mediaUrls: string[], type: 'photo' | 'video' = 'photo'): Promise<any[]> {
    const media = mediaUrls.slice(0, 10).map(url => ({ type, media: url }));
    return (await this.call('sendMediaGroup', { chat_id: chatId, media })).result;
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async sendChatAction(chatId: string | number, action: 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'upload_document' = 'typing'): Promise<void> {
    await this.call('sendChatAction', { chat_id: chatId, action });
  }

  async deleteMessage(chatId: string | number, messageId: number): Promise<void> {
    await this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  async editMessageText(chatId: string | number, messageId: number, text: string, parseMode?: 'HTML' | 'MarkdownV2'): Promise<any> {
    return (await this.call('editMessageText', {
      chat_id:    chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
    })).result;
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: showAlert });
  }

  // ── Inline keyboards ─────────────────────────────────────────────────────

  buildInlineKeyboard(buttons: { text: string; callbackData?: string; url?: string }[][]): any {
    return {
      inline_keyboard: buttons.map(row =>
        row.map(b => ({
          text:          b.text,
          ...(b.callbackData ? { callback_data: b.callbackData } : {}),
          ...(b.url          ? { url: b.url }                    : {}),
        })),
      ),
    };
  }

  // ── Bot info ─────────────────────────────────────────────────────────────

  async getMe(): Promise<any> {
    return (await this.call('getMe')).result;
  }

  async getChat(chatId: string | number): Promise<any> {
    return (await this.call('getChat', { chat_id: chatId })).result;
  }

  async getChatMemberCount(chatId: string | number): Promise<number> {
    return (await this.call('getChatMemberCount', { chat_id: chatId })).result;
  }

  // ── Broadcast ────────────────────────────────────────────────────────────

  async broadcast(chatIds: (string | number)[], text: string, parseMode?: 'HTML' | 'MarkdownV2'): Promise<{ sent: number; failed: number }> {
    let sent = 0; let failed = 0;
    for (const chatId of chatIds) {
      try {
        await this.sendMessage({ chatId, text, parseMode });
        sent++;
        // Respect Telegram rate limit (30 msg/sec to different users)
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        failed++;
        this.logger.warn(`broadcast failed for ${chatId}: ${err}`);
      }
    }
    return { sent, failed };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async call(method: string, body?: any): Promise<any> {
    const res = await fetch(`${BASE}${this.botToken}/${method}`, {
      method:  body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
    return data;
  }
}
