/**
 * TikTok Publisher
 * TikTok for Business API v2 — video posts (FILE_UPLOAD source type).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  TikTokInitResponse,
  TikTokStatusResponse,
} from '../../types/social.types';

const TIKTOK_API = 'https://open.tiktokapis.com/v2';
const OAUTH_SCOPE = 'video.upload,video.publish,user.info.basic';

@Injectable()
export class TikTokPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(TikTokPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientKey = this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '';
    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: 'code',
      scope: OAUTH_SCOPE,
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult> {
    const clientKey = this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '';
    const clientSecret = this.config.get<string>('TIKTOK_CLIENT_SECRET') ?? '';

    const tokenRes = await this.fetchJson<{
      data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        refresh_expires_in: number;
        scope: string;
        open_id: string;
      };
      error?: { code: string; message: string };
    }>(`${TIKTOK_API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (tokenRes.error?.code && tokenRes.error.code !== 'ok') {
      throw new Error(`TikTok OAuth error: ${tokenRes.error.message}`);
    }

    const { access_token, refresh_token, expires_in, open_id, scope } = tokenRes.data;

    // Get user info
    const userRes = await this.fetchJson<{
      data: {
        user: {
          open_id: string;
          display_name: string;
          avatar_url?: string;
        };
      };
    }>(`${TIKTOK_API}/user/info/?fields=open_id,display_name,avatar_url`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userRes.data.user;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      scope,
      platformUserId: open_id,
      displayName: user.display_name,
      avatar: user.avatar_url,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const mediaUrls: string[] = post.mediaUrls ?? [];

      if (!mediaUrls.length) {
        throw new Error('TikTok requires a video. No media URLs provided.');
      }

      const videoUrl = mediaUrls[0];
      const caption = this.buildCaption(post);

      // 1. Init upload
      const initRes = await this.fetchJson<TikTokInitResponse>(
        `${TIKTOK_API}/post/publish/video/init/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            post_info: {
              title: caption.substring(0, 150),
              privacy_level: 'PUBLIC_TO_EVERYONE',
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: videoUrl,
            },
          }),
        },
      );

      if (initRes.error?.code && initRes.error.code !== 'ok') {
        throw new Error(`TikTok publish init failed: ${initRes.error.message}`);
      }

      const publishId = initRes.data.publish_id;

      // 2. Poll for completion
      const result = await this.pollPublishStatus(publishId, accessToken);

      this.logger.log(`TikTok video published: ${publishId}`);
      return {
        platformPostId: publishId,
        platformUrl: result.publicPostId
          ? `https://www.tiktok.com/@${account.platformUsername}/video/${result.publicPostId}`
          : undefined,
      };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientKey = this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '';
    const clientSecret = this.config.get<string>('TIKTOK_CLIENT_SECRET') ?? '';
    const currentRefresh = this.decryptToken(account.refreshToken);

    const res = await this.fetchJson<{
      data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      error?: { code: string; message: string };
    }>(`${TIKTOK_API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: currentRefresh,
      }).toString(),
    });

    if (res.error?.code && res.error.code !== 'ok') {
      throw new Error(`TikTok token refresh failed: ${res.error.message}`);
    }

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
    };
  }

  async revokeToken(account: any): Promise<void> {
    const clientKey = this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '';
    const clientSecret = this.config.get<string>('TIKTOK_CLIENT_SECRET') ?? '';
    const token = this.decryptToken(account.accessToken);

    await fetch(`${TIKTOK_API}/oauth/revoke/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        token,
      }).toString(),
    }).catch(() => {});
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async pollPublishStatus(
    publishId: string,
    accessToken: string,
    maxWaitMs = 300_000,
  ): Promise<{ publicPostId?: string }> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const res = await this.fetchJson<TikTokStatusResponse>(
        `${TIKTOK_API}/post/publish/status/fetch/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ publish_id: publishId }),
        },
      );

      const status = res.data.status;

      if (status === 'PUBLISH_COMPLETE') {
        return {
          publicPostId: res.data.publicaly_available_post_id,
        };
      }

      if (status === 'FAILED') {
        throw new Error(
          `TikTok publish failed: ${res.data.fail_reason ?? 'unknown'}`,
        );
      }

      await new Promise((r) => setTimeout(r, 10_000));
    }

    throw new Error('TikTok publish status polling timed out');
  }

  private buildCaption(post: any): string {
    const parts: string[] = [post.content ?? ''];
    if (post.hashtags?.length) {
      parts.push(
        ' ' +
          (post.hashtags as string[]).map((h: string) => `#${h.replace(/^#/, '')}`).join(' '),
      );
    }
    return parts.join('').trim().substring(0, 2200);
  }
}
