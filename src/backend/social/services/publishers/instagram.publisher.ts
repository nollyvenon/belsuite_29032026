/**
 * Instagram Publisher
 * Uses the Instagram Graph API (via Facebook OAuth).
 * Supports image, video (Reels), and carousel posts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  FacebookPagesResponse,
  InstagramContainerResponse,
  InstagramBusinessAccount,
} from '../../types/social.types';

const GRAPH_BASE = 'https://graph.facebook.com/v18.0';
const OAUTH_SCOPE = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_manage_posts',
  'business_management',
].join(',');

@Injectable()
export class InstagramPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(InstagramPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
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
    const clientId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('INSTAGRAM_APP_SECRET') ?? '';

    // 1. Exchange code for short-lived access token
    const tokenRes = await this.fetchJson<{
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

    // 2. Upgrade to long-lived token
    const longLivedRes = await this.fetchJson<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>(
      `${GRAPH_BASE}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: tokenRes.access_token,
        }).toString(),
    );

    const userToken = longLivedRes.access_token;
    const expiresAt = new Date(
      Date.now() + longLivedRes.expires_in * 1000,
    );

    // 3. Get Facebook pages
    const pages = await this.fetchJson<FacebookPagesResponse>(
      `${GRAPH_BASE}/me/accounts?access_token=${userToken}`,
    );

    if (!pages.data?.length) {
      throw new Error(
        'No Facebook Pages found. Please connect a Facebook Page with an Instagram Business account.',
      );
    }

    const page = pages.data[0];
    const pageToken = page.access_token;

    // 4. Get linked Instagram business account
    const igRes = await this.fetchJson<{
      instagram_business_account?: InstagramBusinessAccount;
      id: string;
    }>(
      `${GRAPH_BASE}/${page.id}?fields=instagram_business_account&access_token=${pageToken}`,
    );

    const igAccount = igRes.instagram_business_account;
    if (!igAccount) {
      throw new Error(
        'No Instagram Business account linked to this Facebook Page.',
      );
    }

    // 5. Get IG account details
    const igDetails = await this.fetchJson<{
      id: string;
      name?: string;
      username?: string;
      profile_picture_url?: string;
    }>(
      `${GRAPH_BASE}/${igAccount.id}?fields=id,name,username,profile_picture_url&access_token=${pageToken}`,
    );

    return {
      accessToken: pageToken,
      expiresAt,
      scope: OAUTH_SCOPE,
      platformUserId: igAccount.id,
      displayName: igDetails.name ?? igDetails.username ?? page.name,
      avatar: igDetails.profile_picture_url,
      pageId: page.id,
      pageName: page.name,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const igUserId = account.platformUserId as string;
      const mediaUrls: string[] = post.mediaUrls ?? [];
      const isVideo =
        mediaUrls.length === 1 &&
        /\.(mp4|mov|avi|mkv)$/i.test(mediaUrls[0]);
      const isCarousel = mediaUrls.length > 1;

      let containerId: string;

      if (isCarousel) {
        // Create child containers
        const childIds = await Promise.all(
          mediaUrls.map((url: string) =>
            this.createContainer(igUserId, accessToken, {
              mediaType: 'IMAGE',
              imageUrl: url,
              isCarouselItem: true,
            }),
          ),
        );

        // Create carousel container
        containerId = await this.createContainer(igUserId, accessToken, {
          mediaType: 'CAROUSEL',
          caption: this.buildCaption(post),
          children: childIds,
        });
      } else if (isVideo) {
        containerId = await this.createContainer(igUserId, accessToken, {
          mediaType: 'REELS',
          videoUrl: mediaUrls[0],
          caption: this.buildCaption(post),
        });
        // Wait for video container to be ready
        await this.waitForContainer(igUserId, containerId, accessToken);
      } else {
        containerId = await this.createContainer(igUserId, accessToken, {
          mediaType: 'IMAGE',
          imageUrl: mediaUrls[0],
          caption: this.buildCaption(post),
        });
      }

      // Publish the container
      const published = await this.fetchJson<{ id: string }>(
        `${GRAPH_BASE}/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
          }),
        },
      );

      const platformUrl = `https://www.instagram.com/p/${published.id}/`;
      this.logger.log(`Instagram post published: ${published.id}`);

      return { platformPostId: published.id, platformUrl };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('INSTAGRAM_APP_SECRET') ?? '';
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
    const clientId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('INSTAGRAM_APP_SECRET') ?? '';

    await fetch(
      `${GRAPH_BASE}/${account.platformUserId}/permissions?` +
        new URLSearchParams({
          access_token: accessToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      { method: 'DELETE' },
    ).catch(() => {
      // Best-effort; account deletion proceeds regardless
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async createContainer(
    igUserId: string,
    accessToken: string,
    opts: {
      mediaType: 'IMAGE' | 'REELS' | 'CAROUSEL';
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
      children?: string[];
      isCarouselItem?: boolean;
    },
  ): Promise<string> {
    const body: Record<string, any> = {
      media_type: opts.mediaType,
      access_token: accessToken,
    };

    if (opts.imageUrl) body['image_url'] = opts.imageUrl;
    if (opts.videoUrl) body['video_url'] = opts.videoUrl;
    if (opts.caption) body['caption'] = opts.caption;
    if (opts.isCarouselItem) body['is_carousel_item'] = true;
    if (opts.children?.length) body['children'] = opts.children.join(',');

    const res = await this.fetchJson<InstagramContainerResponse>(
      `${GRAPH_BASE}/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    return res.id;
  }

  private async waitForContainer(
    _igUserId: string,
    containerId: string,
    accessToken: string,
    maxWaitMs = 120_000,
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const res = await this.fetchJson<{
        status_code: string;
        id: string;
      }>(
        `${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`,
      );

      if ((res as any).status_code === 'FINISHED') return;
      if ((res as any).status_code === 'ERROR') {
        throw new Error('Instagram video container processing failed');
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    throw new Error('Instagram video container processing timed out');
  }

  private buildCaption(post: any): string {
    const parts: string[] = [post.content ?? ''];
    if (post.hashtags?.length) {
      parts.push('\n\n' + (post.hashtags as string[]).map((h) => `#${h.replace(/^#/, '')}`).join(' '));
    }
    if (post.link) parts.push(`\n\n${post.link}`);
    return parts.join('').trim();
  }
}
