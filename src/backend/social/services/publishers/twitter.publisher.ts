/**
 * Twitter / X Publisher
 * Twitter API v2 with OAuth 2.0 PKCE.
 * Media upload via v1.1 chunked upload for videos.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  TwitterTweetResponse,
  TwitterMediaUploadResponse,
} from '../../types/social.types';

const API_V2 = 'https://api.twitter.com/2';
const API_V1 = 'https://upload.twitter.com/1.1';

const OAUTH_SCOPE = 'tweet.write tweet.read users.read offline.access';

@Injectable()
export class TwitterPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(TwitterPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string,
  ): string {
    const clientId = this.config.get<string>('TWITTER_CLIENT_ID') ?? '';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: OAUTH_SCOPE,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<OAuthExchangeResult> {
    const clientId = this.config.get<string>('TWITTER_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('TWITTER_CLIENT_SECRET') ?? '';

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    }>(`${API_V2}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier ?? 'challenge',
      }).toString(),
    });

    // Get user info
    const userRes = await this.fetchJson<{
      data: { id: string; name: string; username: string; profile_image_url?: string };
    }>(`${API_V2}/users/me?user.fields=profile_image_url`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });

    return {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: new Date(Date.now() + tokenRes.expires_in * 1000),
      scope: tokenRes.scope,
      platformUserId: userRes.data.id,
      displayName: userRes.data.name,
      avatar: userRes.data.profile_image_url,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const mediaUrls: string[] = post.mediaUrls ?? [];

      const tweetBody: Record<string, any> = {
        text: this.buildTweetText(post),
      };

      // Upload media if present
      if (mediaUrls.length > 0) {
        const mediaIds: string[] = [];

        for (const url of mediaUrls.slice(0, 4)) { // Twitter allows max 4 images, 1 video
          const isVideo = /\.(mp4|mov|avi)$/i.test(url);
          const mediaId = isVideo
            ? await this.uploadMediaChunked(url, accessToken)
            : await this.uploadMediaSimple(url, accessToken);
          mediaIds.push(mediaId);
        }

        if (mediaIds.length > 0) {
          tweetBody['media'] = { media_ids: mediaIds };
        }
      }

      const tweet = await this.fetchJson<TwitterTweetResponse>(
        `${API_V2}/tweets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(tweetBody),
        },
      );

      const tweetId = tweet.data.id;
      const username = account.platformUsername ?? '';
      const platformUrl = `https://twitter.com/${username}/status/${tweetId}`;

      this.logger.log(`Twitter tweet published: ${tweetId}`);
      return { platformPostId: tweetId, platformUrl };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('TWITTER_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('TWITTER_CLIENT_SECRET') ?? '';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const currentRefresh = this.decryptToken(account.refreshToken);

    const res = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>(`${API_V2}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentRefresh,
      }).toString(),
    });

    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    };
  }

  async revokeToken(account: any): Promise<void> {
    const clientId = this.config.get<string>('TWITTER_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('TWITTER_CLIENT_SECRET') ?? '';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const token = this.decryptToken(account.accessToken);

    await fetch(`${API_V2}/oauth2/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({ token }).toString(),
    }).catch(() => {});
  }

  // ── Media upload helpers ──────────────────────────────────────────────────

  private async uploadMediaSimple(
    mediaUrl: string,
    accessToken: string,
  ): Promise<string> {
    // Fetch image bytes
    const imgRes = await fetch(mediaUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch media: ${mediaUrl}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    const totalBytes = buffer.byteLength;

    // INIT
    const initRes = await this.fetchJson<TwitterMediaUploadResponse>(
      `${API_V1}/media/upload.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          command: 'INIT',
          total_bytes: String(totalBytes),
          media_type: mimeType,
        }).toString(),
      },
    );

    const mediaId = initRes.media_id_string;

    // APPEND
    await fetch(`${API_V1}/media/upload.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({
        command: 'APPEND',
        media_id: mediaId,
        segment_index: '0',
        media_data: buffer.toString('base64'),
      }).toString(),
    });

    // FINALIZE
    await this.fetchJson<TwitterMediaUploadResponse>(
      `${API_V1}/media/upload.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          command: 'FINALIZE',
          media_id: mediaId,
        }).toString(),
      },
    );

    return mediaId;
  }

  private async uploadMediaChunked(
    mediaUrl: string,
    accessToken: string,
    chunkSize = 5 * 1024 * 1024, // 5 MB chunks
  ): Promise<string> {
    const videoRes = await fetch(mediaUrl);
    if (!videoRes.ok) throw new Error(`Failed to fetch video: ${mediaUrl}`);
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    const totalBytes = buffer.byteLength;
    const mimeType = videoRes.headers.get('content-type') ?? 'video/mp4';

    // INIT
    const initRes = await this.fetchJson<TwitterMediaUploadResponse>(
      `${API_V1}/media/upload.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          command: 'INIT',
          total_bytes: String(totalBytes),
          media_type: mimeType,
          media_category: 'tweet_video',
        }).toString(),
      },
    );

    const mediaId = initRes.media_id_string;
    let segmentIndex = 0;
    let offset = 0;

    // APPEND chunks
    while (offset < totalBytes) {
      const chunk = buffer.subarray(offset, offset + chunkSize);
      await fetch(`${API_V1}/media/upload.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          command: 'APPEND',
          media_id: mediaId,
          segment_index: String(segmentIndex),
          media_data: chunk.toString('base64'),
        }).toString(),
      });
      offset += chunkSize;
      segmentIndex++;
    }

    // FINALIZE
    const finalRes = await this.fetchJson<TwitterMediaUploadResponse>(
      `${API_V1}/media/upload.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          command: 'FINALIZE',
          media_id: mediaId,
        }).toString(),
      },
    );

    // Poll until processing is complete
    if (finalRes.processing_info) {
      await this.pollMediaProcessing(mediaId, accessToken);
    }

    return mediaId;
  }

  private async pollMediaProcessing(
    mediaId: string,
    accessToken: string,
    maxWaitMs = 120_000,
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const status = await this.fetchJson<TwitterMediaUploadResponse>(
        `${API_V1}/media/upload.json?command=STATUS&media_id=${mediaId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const info = status.processing_info;
      if (!info || info.state === 'succeeded') return;
      if (info.state === 'failed') {
        throw new Error(
          `Twitter media processing failed: ${info.error?.message ?? 'unknown'}`,
        );
      }

      const waitMs = (info.check_after_secs ?? 5) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    throw new Error('Twitter media processing timed out');
  }

  private buildTweetText(post: any): string {
    let text = (post.content ?? '') as string;

    // Twitter limit: 280 chars
    if (text.length > 277) text = text.substring(0, 277) + '…';

    const tags = (post.hashtags as string[] | undefined)
      ?.map((h) => `#${h.replace(/^#/, '')}`)
      .join(' ') ?? '';

    const combined = tags ? `${text}\n${tags}` : text;
    return combined.length <= 280 ? combined : text;
  }
}
