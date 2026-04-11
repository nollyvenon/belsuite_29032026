import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: unknown[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: SlackMessage) {
    const token = this.config.get('SLACK_BOT_TOKEN') ?? '';
    const channel = message.channel || this.config.get('SLACK_DEFAULT_CHANNEL') || '#alerts';
    if (!token) throw new Error('Slack bot token is not configured');

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel,
        text: message.text,
        blocks: message.blocks,
      }),
    });

    const data = await response.json() as any;
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `Slack request failed: ${response.status}`);
    }

    this.logger.log(`Slack message sent to ${channel}`);
    return {
      ok: true,
      channel,
      ts: data.ts,
      messageId: data.ts ?? `${Date.now()}`,
    };
  }
}
