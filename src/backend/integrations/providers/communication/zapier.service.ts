import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ZapierTriggerPayload {
  hookName: string;
  payload: Record<string, unknown>;
  organizationId?: string;
}

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);

  constructor(private readonly config: ConfigService) {}

  async trigger(input: ZapierTriggerPayload) {
    const url = this.config.get('ZAPIER_WEBHOOK_URL');
    if (!url) throw new Error('Zapier webhook URL is not configured');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hookName: input.hookName,
        organizationId: input.organizationId,
        payload: input.payload,
        source: 'belsuite',
      }),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${bodyText}`);
    }

    this.logger.log(`Zapier hook triggered: ${input.hookName}`);
    return { ok: true, status: response.status, response: bodyText.slice(0, 500) };
  }
}
