import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import OpenAI from 'openai';

interface StartOutboundCallInput {
  organizationId: string;
  callId: string;
  to?: string;
  script: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CallingProviderService {
  private readonly openai: OpenAI | null;

  constructor() {
    this.openai = process.env['OPENAI_API_KEY']
      ? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
      : null;
  }

  async startOutboundCall(input: StartOutboundCallInput) {
    if (!input.to) {
      return {
        provider: 'twilio_voice',
        status: 'failed',
        error: 'Missing destination number',
      };
    }

    const sid = process.env['TWILIO_ACCOUNT_SID'];
    const token = process.env['TWILIO_AUTH_TOKEN'];
    const from = process.env['TWILIO_VOICE_FROM'];
    const baseUrl = process.env['PUBLIC_API_BASE_URL'];

    if (!sid || !token || !from || !baseUrl) {
      return {
        provider: 'twilio_voice',
        status: 'failed',
        error: 'Twilio voice provider is not configured',
      };
    }

    const safeScript = this.escapeXml(input.script);
    const statusCallback = `${baseUrl}/api/ai-calling/webhooks/twilio/voice`;
    const recordingCallback = `${baseUrl}/api/ai-calling/webhooks/twilio/recording`;

    const twiml = `<Response><Say voice="Polly.Joanna">${safeScript}</Say><Pause length="1"/><Say voice="Polly.Joanna">If this is a good time, please share your biggest growth goal.</Say><Record maxLength="120" playBeep="true" recordingStatusCallback="${this.escapeXml(recordingCallback)}"/></Response>`;

    const body = new URLSearchParams({
      To: input.to,
      From: from,
      Twiml: twiml,
      StatusCallback: statusCallback,
      StatusCallbackMethod: 'POST',
      Record: 'true',
      RecordingStatusCallback: recordingCallback,
      RecordingStatusCallbackMethod: 'POST',
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!response.ok) {
      return {
        provider: 'twilio_voice',
        status: 'failed',
        error: payload.message || `HTTP ${response.status}`,
      };
    }

    return {
      provider: 'twilio_voice',
      status: 'in_progress',
      providerCallSid: payload.sid,
    };
  }

  async transcribeRecording(recordingUrl: string, recordingSid?: string) {
    const sid = process.env['TWILIO_ACCOUNT_SID'];
    const token = process.env['TWILIO_AUTH_TOKEN'];

    const wavUrl = recordingUrl.endsWith('.wav') || recordingUrl.endsWith('.mp3')
      ? recordingUrl
      : `${recordingUrl}.wav`;

    const response = await fetch(wavUrl, {
      headers: sid && token
        ? { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` }
        : undefined,
    });

    if (!response.ok) {
      return {
        transcript: '',
        language: 'en',
        confidence: 0,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = join(tmpdir(), `call-recording-${recordingSid || Date.now()}.wav`);
    writeFileSync(filePath, buffer);

    try {
      if (!this.openai) {
        return {
          transcript: 'Transcription unavailable because OPENAI_API_KEY is not configured.',
          language: 'en',
          confidence: 0,
        };
      }

      const res = await this.openai.audio.transcriptions.create({
        file: await import('fs').then((fs) => fs.createReadStream(filePath) as any),
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      const verbose = res as any;
      return {
        transcript: verbose.text || '',
        language: verbose.language || 'en',
        confidence: 0.9,
      };
    } finally {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore cleanup failures
      }
    }
  }

  verifyTwilioSignature(callbackUrl: string, payload: Record<string, unknown>, signature?: string) {
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    if (!authToken || !signature) return false;

    const keys = Object.keys(payload).sort();
    let data = callbackUrl;
    for (const key of keys) {
      const value = payload[key];
      if (value !== undefined && value !== null) {
        data += key + String(value);
      }
    }

    const expected = createHmac('sha1', authToken).update(data).digest('base64');
    return expected === signature;
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
