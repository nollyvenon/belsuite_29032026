/**
 * Facebook Publisher
 * Uses the Facebook Graph API to publish text, photo, and video posts to Pages.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  FacebookPagesResponse,
  FacebookPostResponse,
} from '../../types/social.types';

const GRAPH_BASE = 'https://graph.facebook.com/v18.0';
const OAUTH_SCOPE = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'publish_pages',
].join(',');

@Injectable()
export class FacebookPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(FacebookPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>('FACEBOOK_APP_ID') ?? '';
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
    const clientId = this.config.get<string>('FACEBOOK_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('FACEBOOK_APP_SECRET') ?? '';

    // 1. Short-lived token
    const shortRes = await this.fetchJson<{
      access_token: string;
      token_type: string;
    }>(
      `${GRAPH_BASE}/oauth/access_token?` +
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }).toString(),
    );

    // 2. Long-lived token
    const longRes = await this.fetchJson<{
      access_token: string;
      expires_in: number;
    }>(
      `${GRAPH_BASE}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortRes.access_token,
        }).toString(),
    );

    const userToken = longRes.access_token;

    // 3. Get pages and their Page Access Tokens
    const pages = await this.fetchJson<FacebookPagesResponse>(
      `${GRAPH_BASE}/me/accounts?access_token=${userToken}`,
    );

    if (!pages.data?.length) {
      throw new Error(
        'No Facebook Pages found. Please grant access to at least one Page.',
      );
    }

    const page = pages.data[0];

    return {
      accessToken: page.access_token, // Page-scoped, long-lived
      expiresAt: new Date(Date.now() + longRes.expires_in * 1000),
      scope: OAUTH_SCOPE,
      platformUserId: page.id,
      displayName: page.name,
      pageId: page.id,
      pageName: page.name,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const pageId = account.pageId as string;
      const mediaUrls: string[] = post.mediaUrls ?? [];
      const message = this.buildMessage(post);

      let result: FacebookPostResponse;

      if (mediaUrls.length > 0) {
        const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrls[0]);

        if (isVideo) {
          result = await this.postVideo(pageId, accessToken, mediaUrls[0], message);
        } else if (mediaUrls.length === 1) {
          result = await this.postPhoto(pageId, accessToken, mediaUrls[0], message);
        } else {
          // Multiple images — use multi-photo post
          result = await this.postMultiPhoto(pageId, accessToken, mediaUrls, message);
        }
      } else {
        result = await this.postFeed(pageId, accessToken, message, post.link);
      }

      const postId = result.post_id ?? result.id;
      const platformUrl = `https://www.facebook.com/${postId}`;

      this.logger.log(`Facebook post published: ${postId}`);
      return { platformPostId: postId, platformUrl };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('FACEBOOK_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('FACEBOOK_APP_SECRET') ?? '';
    const currentToken = this.decryptToken(account.accessToken);

    const res = await this.fetchJson<{
      access_token: string;
      expires_in: number;
    }>(
      `${GRAPH_BASE}/oauth/access_token?` +
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
    const accessToken = this.decryptToken(account.accessToken);
    await fetch(
      `${GRAPH_BASE}/${account.platformUserId}/permissions?access_token=${accessToken}`,
      { method: 'DELETE' },
    ).catch(() => {});
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async postFeed(
    pageId: string,
    accessToken: string,
    message: string,
    link?: string,
  ): Promise<FacebookPostResponse> {
    const body: Record<string, string> = { message, access_token: accessToken };
    if (link) body['link'] = link;

    return this.fetchJson<FacebookPostResponse>(`${GRAPH_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async postPhoto(
    pageId: string,
    accessToken: string,
    photoUrl: string,
    message: string,
  ): Promise<FacebookPostResponse> {
    return this.fetchJson<FacebookPostResponse>(
      `${GRAPH_BASE}/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photoUrl, caption: message, access_token: accessToken }),
      },
    );
  }

  private async postMultiPhoto(
    pageId: string,
    accessToken: string,
    photoUrls: string[],
    message: string,
  ): Promise<FacebookPostResponse> {
    // Stage each photo without publishing
    const stagedIds = await Promise.all(
      photoUrls.map((url) =>
        this.fetchJson<{ id: string }>(`${GRAPH_BASE}/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, published: false, access_token: accessToken }),
        }).then((r) => r.id),
      ),
    );

    // Create feed post referencing staged photos
    return this.fetchJson<FacebookPostResponse>(`${GRAPH_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        attached_media: stagedIds.map((id) => ({ media_fbid: id })),
        access_token: accessToken,
      }),
    });
  }

  private async postVideo(
    pageId: string,
    accessToken: string,
    videoUrl: string,
    description: string,
  ): Promise<FacebookPostResponse> {
    return this.fetchJson<FacebookPostResponse>(
      `${GRAPH_BASE}/${pageId}/videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          description,
          access_token: accessToken,
        }),
      },
    );
  }

  private buildMessage(post: any): string {
    const parts: string[] = [post.content ?? ''];
    if (post.hashtags?.length) {
      parts.push('\n\n' + (post.hashtags as string[]).map((h: string) => `#${h.replace(/^#/, '')}`).join(' '));
    }
    return parts.join('').trim();
  }
}
