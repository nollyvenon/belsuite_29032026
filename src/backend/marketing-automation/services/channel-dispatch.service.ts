import { Injectable } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { AIModel } from '../../ai/types/ai.types';
import { EmailService } from '../../email/services/email.service';

export interface MarketingDispatchPayload {
  organizationId: string;
  userId?: string;
  campaignId: string;
  runId: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'voice' | 'ai_voice_agent';
  contact: Record<string, unknown>;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ChannelDispatchService {
  constructor(
    private readonly emailService: EmailService,
    private readonly aiService: AIService,
  ) {}

  async dispatch(payload: MarketingDispatchPayload) {
    switch (payload.channel) {
      case 'email':
        return this.sendEmail(payload);
      case 'sms':
        return this.sendTwilioMessage(payload, false);
      case 'whatsapp':
        return this.sendTwilioMessage(payload, true);
      case 'voice':
        return this.placeVoiceCall(payload, payload.message);
      case 'ai_voice_agent': {
        const script = await this.generateVoiceScript(payload);
        return this.placeVoiceCall(payload, script, 'ai_voice_agent');
      }
      default:
        return {
          success: false,
          status: 'failed',
          provider: 'unsupported',
          error: 'Unsupported channel',
        };
    }
  }

  private async sendEmail(payload: MarketingDispatchPayload) {
    const recipient = this.readString(payload.contact.email);
    if (!recipient) {
      return { success: false, status: 'failed', provider: 'sendgrid', error: 'Missing email recipient' };
    }

    const response = await this.emailService.send(
      {
        to: recipient,
        subject: payload.subject || 'BelSuite marketing message',
        html: `<p>${this.escapeHtml(payload.message).replace(/\n/g, '<br/>')}</p>`,
        text: payload.message,
        tags: ['marketing_automation'],
        metadata: {
          campaignId: payload.campaignId,
          runId: payload.runId,
          channel: payload.channel,
          ...(payload.metadata || {}),
        },
      },
      payload.organizationId,
    );

    return {
      success: response.success,
      status: response.success ? 'sent' : 'failed',
      provider: response.provider,
      recipient,
      providerMessageId: response.messageId,
      error: response.error,
    };
  }

  private async sendTwilioMessage(payload: MarketingDispatchPayload, isWhatsApp: boolean) {
    const toPhone = this.readString(payload.contact.phone);
    if (!toPhone) {
      return { success: false, status: 'failed', provider: 'twilio', error: 'Missing phone recipient' };
    }

    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const fromNumber = isWhatsApp
      ? process.env['TWILIO_WHATSAPP_FROM']
      : process.env['TWILIO_SMS_FROM'];

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: true,
        status: 'simulated',
        provider: isWhatsApp ? 'twilio_whatsapp' : 'twilio_sms',
        recipient: toPhone,
      };
    }

    const params = new URLSearchParams({
      To: isWhatsApp ? `whatsapp:${toPhone}` : toPhone,
      From: isWhatsApp ? `whatsapp:${fromNumber}` : fromNumber,
      Body: payload.message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    const result = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        provider: isWhatsApp ? 'twilio_whatsapp' : 'twilio_sms',
        recipient: toPhone,
        error: result.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      status: 'sent',
      provider: isWhatsApp ? 'twilio_whatsapp' : 'twilio_sms',
      recipient: toPhone,
      providerMessageId: result.sid,
    };
  }

  private async placeVoiceCall(
    payload: MarketingDispatchPayload,
    script: string,
    providerLabel = 'twilio_voice',
  ) {
    const toPhone = this.readString(payload.contact.phone);
    if (!toPhone) {
      return { success: false, status: 'failed', provider: providerLabel, error: 'Missing phone recipient' };
    }

    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const fromNumber = process.env['TWILIO_VOICE_FROM'];

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: true,
        status: 'simulated',
        provider: providerLabel,
        recipient: toPhone,
        script,
      };
    }

    const twiml = `<Response><Say voice="Polly.Joanna">${this.escapeXml(script)}</Say></Response>`;
    const params = new URLSearchParams({
      To: toPhone,
      From: fromNumber,
      Twiml: twiml,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    const result = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        provider: providerLabel,
        recipient: toPhone,
        error: result.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      status: 'sent',
      provider: providerLabel,
      recipient: toPhone,
      providerMessageId: result.sid,
    };
  }

  private async generateVoiceScript(payload: MarketingDispatchPayload) {
    const fullName = this.readString(payload.contact.fullName) || 'there';
    const companyName = this.readString(payload.contact.companyName) || 'your team';
    const prompt = `Write a concise outbound AI voice call script for a sales development rep.
Objective: ${payload.metadata?.objective || 'book a short demo'}
Recipient: ${fullName}
Company: ${companyName}
Offer context: ${payload.message}
Constraints: under 90 words, natural spoken language, clear CTA.
Return plain text only.`;

    try {
      const response = await this.aiService.generateText(
        {
          prompt,
          model: AIModel.GPT_4_TURBO,
          temperature: 0.35,
          maxTokens: 180,
        },
        payload.organizationId,
        payload.userId || 'system',
        { type: 'best_quality' },
        true,
      );

      return response.text.trim();
    } catch {
      return `Hi ${fullName}, this is BelSuite. We noticed a strong opportunity to help ${companyName} improve pipeline performance. If growth is a priority this quarter, reply or call back and we will share a focused action plan.`;
    }
  }

  private readString(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
