import { Injectable } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { GmailMessage, GmailSendOptions } from '../../types/integration.types';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

@Injectable()
export class GmailService {
  constructor(private readonly gauth: GoogleAuthService) {}

  async listMessages(
    organizationId: string,
    options?: { query?: string; maxResults?: number; labelIds?: string[] },
  ): Promise<GmailMessage[]> {
    const params = new URLSearchParams({
      maxResults: String(options?.maxResults ?? 20),
      ...(options?.query ? { q: options.query } : {}),
      ...(options?.labelIds?.length ? { labelIds: options.labelIds.join(',') } : {}),
    });

    const list = await this.gauth.apiFetch(organizationId, `${BASE}/messages?${params}`);
    if (!list.messages?.length) return [];

    // Fetch details for each message
    const messages = await Promise.all(
      (list.messages as any[]).slice(0, 20).map((m: any) =>
        this.getMessage(organizationId, m.id),
      ),
    );

    return messages.filter(Boolean) as GmailMessage[];
  }

  async getMessage(organizationId: string, messageId: string): Promise<GmailMessage | null> {
    try {
      const data = await this.gauth.apiFetch(
        organizationId,
        `${BASE}/messages/${messageId}?format=full`,
      );
      return this.parseMessage(data);
    } catch {
      return null;
    }
  }

  async sendMessage(organizationId: string, opts: GmailSendOptions): Promise<string> {
    const toArr   = Array.isArray(opts.to) ? opts.to : [opts.to];
    const headers = [
      `To: ${toArr.join(', ')}`,
      `Subject: ${opts.subject}`,
      opts.html ? 'Content-Type: text/html; charset=UTF-8' : 'Content-Type: text/plain; charset=UTF-8',
      ...(opts.cc?.length  ? [`Cc: ${opts.cc.join(', ')}`]  : []),
      ...(opts.bcc?.length ? [`Bcc: ${opts.bcc.join(', ')}`] : []),
    ].join('\r\n');

    const raw = Buffer.from(`${headers}\r\n\r\n${opts.body}`).toString('base64url');

    const endpoint = opts.replyToId
      ? `${BASE}/messages/send`
      : `${BASE}/messages/send`;

    const body: any = { raw };
    if (opts.replyToId) body.threadId = opts.replyToId;

    const result = await this.gauth.apiFetch(organizationId, endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    return result.id;
  }

  async createDraft(organizationId: string, opts: GmailSendOptions): Promise<string> {
    const toArr   = Array.isArray(opts.to) ? opts.to : [opts.to];
    const headers = [
      `To: ${toArr.join(', ')}`,
      `Subject: ${opts.subject}`,
      'Content-Type: text/plain; charset=UTF-8',
    ].join('\r\n');

    const raw = Buffer.from(`${headers}\r\n\r\n${opts.body}`).toString('base64url');
    const result = await this.gauth.apiFetch(organizationId, `${BASE}/drafts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: { raw } }),
    });

    return result.id;
  }

  async listLabels(organizationId: string) {
    const data = await this.gauth.apiFetch(organizationId, `${BASE}/labels`);
    return data.labels ?? [];
  }

  async markAsRead(organizationId: string, messageId: string): Promise<void> {
    await this.gauth.apiFetch(organizationId, `${BASE}/messages/${messageId}/modify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private parseMessage(data: any): GmailMessage {
    const headers: Record<string, string> = {};
    for (const h of data.payload?.headers ?? []) {
      headers[h.name.toLowerCase()] = h.value;
    }

    const body = this.extractBody(data.payload);

    return {
      id:       data.id,
      threadId: data.threadId,
      from:     headers['from']    ?? '',
      to:       (headers['to'] ?? '').split(',').map((s: string) => s.trim()),
      subject:  headers['subject'] ?? '(no subject)',
      body,
      snippet:  data.snippet ?? '',
      date:     new Date(parseInt(data.internalDate)),
      labels:   data.labelIds ?? [],
      isRead:   !(data.labelIds ?? []).includes('UNREAD'),
    };
  }

  private extractBody(payload: any): string {
    if (!payload) return '';
    if (payload.body?.data) return Buffer.from(payload.body.data, 'base64url').toString('utf8');
    for (const part of payload.parts ?? []) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        if (part.body?.data) return Buffer.from(part.body.data, 'base64url').toString('utf8');
      }
      const nested = this.extractBody(part);
      if (nested) return nested;
    }
    return '';
  }
}
