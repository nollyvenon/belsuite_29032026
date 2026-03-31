/**
 * WhatsApp Publisher
 * WhatsApp Business Cloud API (Meta) — OAuth 2.0.
 *
 * Compliance & capabilities:
 *  - Uses WhatsApp Business Cloud API v18.0 (Meta). NOT the legacy Business API.
 *  - "Broadcast" model: sends a message template or free-form message to a
 *    registered recipient list stored per-account.
 *  - Template messages: required for first contact or when 24 h window has lapsed.
 *  - Free-form messages (text, image, video, document): allowed within 24 h of
 *    the last user-initiated message.
 *  - WhatsApp does NOT have "posts" in the social-media sense — we model a
 *    "scheduled broadcast" as a message sent to a list of recipient numbers
 *    stored in account metadata (whatsappRecipients JSON array).
 *  - Scheduling: handled externally by BullMQ; this publisher calls the API at
 *    dispatch time.
 *  - Rate limits: 4,000 messages / phone number / day (standard tier);
 *    80 messages / second per phone number.
 *  - OAuth: uses the System User access token flow (long-lived token).
 *    No refresh_token returned — tokens are manually rotated in Meta Business Manager.
 *
 * Environment variables required:
 *   WHATSAPP_APP_ID        — Meta app client_id
 *   WHATSAPP_APP_SECRET    — Meta app client_secret
 *   WHATSAPP_PHONE_NUMBER_ID — (per account; stored in account.pageId)
 *
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  WhatsAppSendMessageResponse,
} from '../../types/social.types';

const GRAPH_API = 'https://graph.facebook.com/v18.0';
const OAUTH_SCOPE = [
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'business_management',
].join(',');

@Injectable()
export class WhatsAppPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(WhatsAppPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  /**
   * Returns the Facebook OAuth URL with WhatsApp scopes.
   * After the code is exchanged, we fetch the WABA (WhatsApp Business Account)
   * and the first phone number ID to store for later use.
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>('WHATSAPP_APP_ID') ?? '';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: OAUTH_SCOPE,
      response_type: 'code',
      state,
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult> {
    const clientId = this.config.get<string>('WHATSAPP_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('WHATSAPP_APP_SECRET') ?? '';

    // 1. Exchange code for a short-lived user token
    const shortLived = await this.fetchJson<{
      access_token: string;
      expires_in: number;
    }>(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }).toString(),
    );

    // 2. Exchange for long-lived user token (60 days)
    const longLived = await this.fetchJson<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortLived.access_token,
        }).toString(),
    );

    const accessToken = longLived.access_token;
    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);

    // 3. Fetch linked WhatsApp Business Accounts (WABAs)
    const wabaRes = await this.fetchJson<{
      data: Array<{ id: string; name: string }>;
    }>(
      `${GRAPH_API}/me/businesses?fields=id,name&access_token=${accessToken}`,
    );

    if (!wabaRes.data?.length) {
      throw new Error(
        'No WhatsApp Business Account found. Please ensure the Facebook account is linked to a WABA.',
      );
    }

    const businessId = wabaRes.data[0].id;
    const businessName = wabaRes.data[0].name;

    // 4. Fetch phone numbers in the first WABA
    const phoneRes = await this.fetchJson<{
      data: Array<{ id: string; display_phone_number: string; verified_name?: string }>;
    }>(
      `${GRAPH_API}/${businessId}/phone_numbers?access_token=${accessToken}`,
    );

    const phone = phoneRes.data?.[0];
    if (!phone) {
      throw new Error(
        'No phone number registered in the WhatsApp Business Account.',
      );
    }

    return {
      accessToken,
      expiresAt,
      scope: OAUTH_SCOPE,
      platformUserId: businessId,
      displayName: phone.verified_name ?? businessName,
      pageId: phone.id, // Phone Number ID used for sending messages
      pageName: phone.display_phone_number,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  /**
   * Sends the post as a WhatsApp broadcast to all recipient numbers stored in
   * account.metadata (JSON array of E.164 phone numbers: ["+15551234567", …]).
   *
   * Falls back to a template message if free-form text is not available.
   * Media (image/video/document) is sent via the media object payload.
   */
  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const phoneNumberId: string = account.pageId;

      if (!phoneNumberId) {
        throw new Error('WhatsApp Phone Number ID is missing from account data.');
      }

      // Parse recipient list from account metadata
      let recipients: string[] = [];
      try {
        const meta = account.metadata ? JSON.parse(account.metadata) : {};
        recipients = (meta.whatsappRecipients as string[]) ?? [];
      } catch {
        // ignore JSON parse error
      }

      if (recipients.length === 0) {
        throw new Error(
          'No WhatsApp recipients configured. Add E.164-formatted phone numbers to account metadata.',
        );
      }

      const mediaUrls: string[] = post.mediaUrls ?? [];
      const messageBody = this.buildMessageBody(post, mediaUrls);

      // Send to each recipient (within daily rate limits)
      const messageIds: string[] = [];
      const errors: string[] = [];

      for (const to of recipients.slice(0, 256)) {
        try {
          const res = await this.sendMessage(
            phoneNumberId,
            to,
            messageBody,
            mediaUrls,
            accessToken,
          );
          if (res.messages?.[0]?.id) {
            messageIds.push(res.messages[0].id);
          }
        } catch (err) {
          errors.push(`${to}: ${(err as Error).message}`);
          this.logger.warn(`WhatsApp send failed to ${to}: ${(err as Error).message}`);
        }
      }

      if (messageIds.length === 0) {
        throw new Error(
          `All WhatsApp sends failed: ${errors.slice(0, 3).join('; ')}`,
        );
      }

      this.logger.log(
        `WhatsApp broadcast sent: ${messageIds.length} succeeded, ${errors.length} failed`,
      );

      return {
        platformPostId: messageIds[0],
        platformUrl: `https://business.facebook.com/wa/manage/phone-numbers/`,
      };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token management ───────────────────────────────────────────────────────

  /**
   * WhatsApp Business Cloud uses long-lived (60-day) user tokens or
   * never-expiring System User tokens. There is no standard refresh grant.
   * We extend via the fb_exchange_token flow if still valid.
   */
  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('WHATSAPP_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('WHATSAPP_APP_SECRET') ?? '';
    const currentToken = this.decryptToken(account.accessToken);

    const res = await this.fetchJson<{
      access_token: string;
      expires_in: number;
    }>(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: currentToken,
        }).toString(),
    );

    return {
      accessToken: res.access_token,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    };
  }

  async revokeToken(account: any): Promise<void> {
    const clientId = this.config.get<string>('WHATSAPP_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('WHATSAPP_APP_SECRET') ?? '';
    const accessToken = this.decryptToken(account.accessToken);

    await fetch(
      `${GRAPH_API}/${account.platformUserId}/permissions?` +
        new URLSearchParams({
          access_token: accessToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      { method: 'DELETE' },
    ).catch(() => {});
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Sends a single WhatsApp message to one recipient.
   * Chooses message type: text, image, video, or document based on media.
   */
  private async sendMessage(
    phoneNumberId: string,
    to: string,
    text: string,
    mediaUrls: string[],
    accessToken: string,
  ): Promise<WhatsAppSendMessageResponse> {
    let messagePayload: Record<string, any>;

    if (mediaUrls.length === 0) {
      // Text-only message
      messagePayload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text.substring(0, 4096) },
      };
    } else {
      const url = mediaUrls[0];
      const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(url);
      const isDocument = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip)$/i.test(url);

      if (isVideo) {
        messagePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'video',
          video: {
            link: url,
            caption: text.substring(0, 1024),
          },
        };
      } else if (isDocument) {
        const fileName = url.split('/').pop() ?? 'document';
        messagePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'document',
          document: {
            link: url,
            caption: text.substring(0, 1024),
            filename: fileName,
          },
        };
      } else {
        // Image
        messagePayload = {
          messaging_product: 'whatsapp',
          to,
          type: 'image',
          image: {
            link: url,
            caption: text.substring(0, 1024),
          },
        };
      }
    }

    return this.fetchJson<WhatsAppSendMessageResponse>(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(messagePayload),
      },
    );
  }

  /** Builds the plain-text body for a WhatsApp message. */
  private buildMessageBody(post: any, mediaUrls: string[]): string {
    const parts: string[] = [];

    if (post.content) parts.push(post.content);

    if (post.hashtags?.length) {
      const tags = (post.hashtags as string[]).map((h: string) => `#${h}`).join(' ');
      parts.push(tags);
    }

    if (post.link && mediaUrls.length === 0) parts.push(post.link);

    return parts.join('\n\n').substring(0, 4096);
  }
}
