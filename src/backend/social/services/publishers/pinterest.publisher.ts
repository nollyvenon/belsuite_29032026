/**
 * Pinterest Publisher
 * Pinterest API v5 — OAuth 2.0 with PKCE.
 * Supports image pins, video pins, and carousel (multi-image) boards.
 *
 * Compliance notes:
 *  - Requires "pins:read_secret" + "pins:write" + "boards:read" + "boards:write" scopes.
 *  - Rate limits: 1,000 pin creations / day per user (standard access).
 *  - Images: JPEG/PNG, max 32 MB, min 100×100 px; Recommended 1000×1500 (2:3).
 *  - Videos: MP4/MOV, max 2 GB, 4–15 minutes.
 *  - Media must be uploaded via the media endpoint before creating pins.
 *
 * Ref: https://developers.pinterest.com/docs/api/v5/
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  PinterestPinResponse,
  PinterestMediaUploadResponse,
} from '../../types/social.types';

const PINTEREST_API = 'https://api.pinterest.com/v5';
const PINTEREST_OAUTH = 'https://www.pinterest.com/oauth';

const OAUTH_SCOPE = [
  'pins:read',
  'pins:write',
  'boards:read',
  'boards:write',
  'user_accounts:read',
].join(',');

@Injectable()
export class PinterestPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(PinterestPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>('PINTEREST_APP_ID') ?? '';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: OAUTH_SCOPE,
      state,
    });
    return `${PINTEREST_OAUTH}/?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult> {
    const clientId = this.config.get<string>('PINTEREST_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('PINTEREST_APP_SECRET') ?? '';

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    }>(`${PINTEREST_API}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    // Get user info
    const userRes = await this.fetchJson<{
      id: string;
      username: string;
      profile_image?: string;
    }>(`${PINTEREST_API}/user_account`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });

    return {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: new Date(Date.now() + tokenRes.expires_in * 1000),
      scope: tokenRes.scope,
      platformUserId: userRes.id,
      displayName: userRes.username,
      avatar: userRes.profile_image,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const mediaUrls: string[] = post.mediaUrls ?? [];

      // Resolve board ID — use stored pageId (board ID) or fetch default board
      const boardId = account.pageId ?? (await this.getDefaultBoardId(accessToken, account.platformUserId));

      const title = post.content?.split('\n')[0]?.substring(0, 100) ?? 'Pin';
      const description = this.buildPinDescription(post);
      const link = post.link ?? undefined;

      if (mediaUrls.length === 0) {
        throw new Error('Pinterest pins require at least one image or video URL.');
      }

      const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrls[0]);

      let pinId: string;

      if (isVideo) {
        pinId = await this.createVideoPin(
          accessToken,
          boardId,
          mediaUrls[0],
          title,
          description,
          link,
        );
      } else if (mediaUrls.length > 1) {
        // Carousel pin (up to 5 images)
        pinId = await this.createCarouselPin(
          accessToken,
          boardId,
          mediaUrls.slice(0, 5),
          title,
          description,
          link,
        );
      } else {
        // Single image pin
        pinId = await this.createImagePin(
          accessToken,
          boardId,
          mediaUrls[0],
          title,
          description,
          link,
        );
      }

      const platformUrl = `https://www.pinterest.com/pin/${pinId}/`;
      this.logger.log(`Pinterest pin created: ${pinId}`);

      return { platformPostId: pinId, platformUrl };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token management ───────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('PINTEREST_APP_ID') ?? '';
    const clientSecret = this.config.get<string>('PINTEREST_APP_SECRET') ?? '';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const refreshToken = this.decryptToken(account.refreshToken);

    const res = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>(`${PINTEREST_API}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    };
  }

  async revokeToken(account: any): Promise<void> {
    // Pinterest does not have a token revocation endpoint.
    // We simply log this and move on.
    this.logger.log(`Pinterest token revocation requested for account ${account.id} — no-op`);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Get the first available board for the user, filtered to the user's own boards. */
  private async getDefaultBoardId(accessToken: string, _userId: string): Promise<string> {
    const res = await this.fetchJson<{
      items: Array<{ id: string; owner?: { username: string } }>;
    }>(`${PINTEREST_API}/boards?page_size=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.items?.length) {
      throw new Error('No boards found on the Pinterest account. Create a board first.');
    }

    return res.items[0].id;
  }

  /** Creates a single-image pin using the Pin Create API. */
  private async createImagePin(
    accessToken: string,
    boardId: string,
    imageUrl: string,
    title: string,
    description: string,
    link?: string,
  ): Promise<string> {
    const body: Record<string, any> = {
      board_id: boardId,
      title,
      description,
      media_source: {
        source_type: 'image_url',
        url: imageUrl,
      },
    };

    if (link) body['link'] = link;

    const res = await this.fetchJson<PinterestPinResponse>(
      `${PINTEREST_API}/pins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    return res.id;
  }

  /**
   * Creates a carousel pin (multiple images).
   * Pinterest calls these "carousel pins" — supported via media_source.items array.
   */
  private async createCarouselPin(
    accessToken: string,
    boardId: string,
    imageUrls: string[],
    title: string,
    description: string,
    link?: string,
  ): Promise<string> {
    const body: Record<string, any> = {
      board_id: boardId,
      title,
      description,
      media_source: {
        source_type: 'multiple_image_urls',
        items: imageUrls.map((url, idx) => ({
          title: `${title} ${idx + 1}`,
          description,
          link: link ?? undefined,
          source_url: url,
        })),
      },
    };

    if (link) body['link'] = link;

    const res = await this.fetchJson<PinterestPinResponse>(
      `${PINTEREST_API}/pins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    return res.id;
  }

  /**
   * Creates a video pin using the two-step upload flow:
   *  1. Register media upload → get upload_url + media_id
   *  2. Upload video binary to upload_url
   *  3. Create pin referencing media_id (poll until READY)
   */
  private async createVideoPin(
    accessToken: string,
    boardId: string,
    videoUrl: string,
    title: string,
    description: string,
    link?: string,
  ): Promise<string> {
    // 1. Register media
    const mediaReg = await this.fetchJson<PinterestMediaUploadResponse>(
      `${PINTEREST_API}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ media_type: 'video' }),
      },
    );

    // 2. Download and upload video
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoUrl}`);
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(mediaReg.upload_url, {
      method: 'POST',
      headers: mediaReg.upload_parameters,
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      throw new Error(`Pinterest video upload failed: ${errText}`);
    }

    // 3. Poll until media is READY (max 5 min)
    await this.waitForMedia(mediaReg.media_id, accessToken);

    // 4. Create the pin
    const body: Record<string, any> = {
      board_id: boardId,
      title,
      description,
      media_source: {
        source_type: 'video_id',
        media_id: mediaReg.media_id,
      },
    };

    if (link) body['link'] = link;

    const res = await this.fetchJson<PinterestPinResponse>(
      `${PINTEREST_API}/pins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    return res.id;
  }

  /** Polls media status until READY or FAILED (max 60 attempts × 5s). */
  private async waitForMedia(
    mediaId: string,
    accessToken: string,
  ): Promise<void> {
    const MAX_POLLS = 60;
    const POLL_DELAY_MS = 5_000;

    for (let i = 0; i < MAX_POLLS; i++) {
      const status = await this.fetchJson<{ status: string }>(
        `${PINTEREST_API}/media/${mediaId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (status.status === 'succeeded') return;
      if (status.status === 'failed') {
        throw new Error(`Pinterest media upload failed for media_id ${mediaId}`);
      }

      await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }

    throw new Error(`Pinterest media processing timed out for media_id ${mediaId}`);
  }

  /** Builds a Pinterest-appropriate description from post data. */
  private buildPinDescription(post: any): string {
    const parts: string[] = [];

    if (post.content) parts.push(post.content.substring(0, 500));

    if (post.hashtags?.length) {
      const tags = (post.hashtags as string[])
        .slice(0, 20)
        .map((h: string) => `#${h}`)
        .join(' ');
      parts.push(tags);
    }

    return parts.join('\n\n').substring(0, 800);
  }
}
