import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';

export type SmsProvider = 'TWILIO' | 'VONAGE' | 'AWS_SNS';

export interface SendSmsOptions {
  to:       string;          // E.164 format, e.g. +14155552671
  body:     string;
  from?:    string;          // Override default sender
  provider?: SmsProvider;
}

export interface SmsResult {
  messageId:  string;
  status:     string;
  provider:   SmsProvider;
  to:         string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(opts: SendSmsOptions): Promise<SmsResult> {
    const provider = opts.provider ?? this.defaultProvider();
    switch (provider) {
      case 'TWILIO':  return this.sendViaTwilio(opts);
      case 'VONAGE':  return this.sendViaVonage(opts);
      case 'AWS_SNS': return this.sendViaSns(opts);
      default:        throw new Error(`Unknown SMS provider: ${provider}`);
    }
  }

  async sendBulk(messages: SendSmsOptions[]): Promise<SmsResult[]> {
    return Promise.all(messages.map(m => this.send(m)));
  }

  // ── Twilio ───────────────────────────────────────────────────────────────

  private async sendViaTwilio(opts: SendSmsOptions): Promise<SmsResult> {
    const accountSid = this.config.get('TWILIO_ACCOUNT_SID') ?? '';
    const authToken  = this.config.get('TWILIO_AUTH_TOKEN')  ?? '';
    const from       = opts.from ?? this.config.get('TWILIO_FROM_NUMBER') ?? '';

    const body = new URLSearchParams({
      To:   opts.to,
      From: from,
      Body: opts.body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    if (!res.ok) throw new Error(`Twilio SMS ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;

    return { messageId: data.sid, status: data.status, provider: 'TWILIO', to: opts.to };
  }

  // ── Vonage (Nexmo) ───────────────────────────────────────────────────────

  private async sendViaVonage(opts: SendSmsOptions): Promise<SmsResult> {
    const apiKey    = this.config.get('VONAGE_API_KEY')    ?? '';
    const apiSecret = this.config.get('VONAGE_API_SECRET') ?? '';
    const from      = opts.from ?? this.config.get('VONAGE_FROM_NUMBER') ?? 'BelSuite';

    const res = await fetch('https://rest.nexmo.com/sms/json', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:    apiKey,
        api_secret: apiSecret,
        to:         opts.to,
        from,
        text:       opts.body,
      }),
    });

    if (!res.ok) throw new Error(`Vonage SMS ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    const msg  = data.messages?.[0];
    if (msg?.status !== '0') throw new Error(`Vonage error ${msg?.status}: ${msg?.['error-text']}`);

    return { messageId: msg['message-id'], status: 'sent', provider: 'VONAGE', to: opts.to };
  }

  // ── AWS SNS ──────────────────────────────────────────────────────────────

  private async sendViaSns(opts: SendSmsOptions): Promise<SmsResult> {
    // Use AWS SDK v3 dynamically to avoid hard dependency
    let SNSClient: any, PublishCommand: any;
    try {
      const mod1 = await import('@aws-sdk/client-sns' as any);
      SNSClient      = mod1.SNSClient;
      PublishCommand = mod1.PublishCommand;
    } catch {
      throw new Error('AWS SDK not installed — run: npm install @aws-sdk/client-sns');
    }

    const client = new SNSClient({
      region:      this.config.get('AWS_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId:     this.config.get('AWS_ACCESS_KEY_ID')     ?? '',
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });

    const command = new PublishCommand({
      Message:     opts.body,
      PhoneNumber: opts.to,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
      },
    });

    const result = await client.send(command);
    return { messageId: result.MessageId ?? '', status: 'sent', provider: 'AWS_SNS', to: opts.to };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private defaultProvider(): SmsProvider {
    if (this.config.get('TWILIO_ACCOUNT_SID'))  return 'TWILIO';
    if (this.config.get('VONAGE_API_KEY'))       return 'VONAGE';
    if (this.config.get('AWS_ACCESS_KEY_ID'))    return 'AWS_SNS';
    throw new Error('No SMS provider configured');
  }
}
