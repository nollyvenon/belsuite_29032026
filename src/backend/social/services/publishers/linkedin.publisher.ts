/**
 * LinkedIn Publisher
 * LinkedIn Marketing API v2 — UGC posts with optional media upload.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePlatformPublisher } from './base.publisher';
import {
  OAuthExchangeResult,
  OAuthTokens,
  PlatformPublishResult,
  LinkedInPostResponse,
  LinkedInRegisterUploadResponse,
} from '../../types/social.types';

const LI_API = 'https://api.linkedin.com/v2';
const LI_OAUTH = 'https://www.linkedin.com/oauth/v2';
const OAUTH_SCOPE = 'w_member_social,r_liteprofile,r_emailaddress';

@Injectable()
export class LinkedInPublisher extends BasePlatformPublisher {
  private readonly logger = new Logger(LinkedInPublisher.name);

  constructor(config: ConfigService) {
    super(config);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>('LINKEDIN_CLIENT_ID') ?? '';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: OAUTH_SCOPE,
      state,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult> {
    const clientId = this.config.get<string>('LINKEDIN_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('LINKEDIN_CLIENT_SECRET') ?? '';

    const tokenRes = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    }>(`${LI_OAUTH}/accessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    // Get profile info
    const profile = await this.fetchJson<{
      id: string;
      localizedFirstName?: string;
      localizedLastName?: string;
      profilePicture?: {
        'displayImage~'?: {
          elements?: Array<{ identifiers: Array<{ identifier: string }> }>;
        };
      };
    }>(`${LI_API}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });

    const displayName =
      [profile.localizedFirstName, profile.localizedLastName]
        .filter(Boolean)
        .join(' ') || profile.id;

    const avatar =
      profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]
        ?.identifier;

    return {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: new Date(Date.now() + tokenRes.expires_in * 1000),
      scope: tokenRes.scope,
      platformUserId: profile.id,
      displayName,
      avatar,
    };
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(account: any, post: any): Promise<PlatformPublishResult> {
    try {
      const accessToken = this.decryptToken(account.accessToken);
      const authorUrn = `urn:li:person:${account.platformUserId}`;
      const mediaUrls: string[] = post.mediaUrls ?? [];

      let shareMediaCategory = 'NONE';
      const media: any[] = [];

      if (mediaUrls.length > 0) {
        const isVideo = /\.(mp4|mov|avi)$/i.test(mediaUrls[0]);
        shareMediaCategory = isVideo ? 'VIDEO' : 'IMAGE';

        for (const url of mediaUrls) {
          const asset = await this.uploadMedia(
            url,
            accessToken,
            authorUrn,
            isVideo ? 'video' : 'image',
          );
          media.push({
            status: 'READY',
            description: { text: post.content?.substring(0, 200) ?? '' },
            media: asset,
            title: { text: '' },
          });
        }
      } else if (post.link) {
        shareMediaCategory = 'ARTICLE';
        media.push({
          status: 'READY',
          originalUrl: post.link,
          title: { text: '' },
          description: { text: '' },
        });
      }

      const ugcBody = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: this.buildText(post) },
            shareMediaCategory,
            media: media.length ? media : undefined,
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const result = await this.fetchJson<LinkedInPostResponse>(
        `${LI_API}/ugcPosts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(ugcBody),
        },
      );

      // LinkedIn returns the URN as the id
      const platformUrl = `https://www.linkedin.com/feed/update/${result.id}/`;

      this.logger.log(`LinkedIn post published: ${result.id}`);
      return { platformPostId: result.id, platformUrl };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(account: any): Promise<OAuthTokens> {
    const clientId = this.config.get<string>('LINKEDIN_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('LINKEDIN_CLIENT_SECRET') ?? '';
    const currentRefresh = this.decryptToken(account.refreshToken);

    const res = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>(`${LI_OAUTH}/accessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentRefresh,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    };
  }

  async revokeToken(_account: any): Promise<void> {
    // LinkedIn does not have a programmatic token revocation endpoint;
    // deletion is handled by user through LinkedIn settings.
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async uploadMedia(
    mediaUrl: string,
    accessToken: string,
    ownerUrn: string,
    mediaType: 'image' | 'video',
  ): Promise<string> {
    const recipeType =
      mediaType === 'video'
        ? 'urn:li:digitalmediaRecipe:feedshare-video'
        : 'urn:li:digitalmediaRecipe:feedshare-image';

    // Register upload
    const registerRes = await this.fetchJson<LinkedInRegisterUploadResponse>(
      `${LI_API}/assets?action=registerUpload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipeType],
            owner: ownerUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      },
    );

    const uploadMechanism =
      registerRes.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ];
    const uploadUrl = uploadMechanism.uploadUrl;
    const asset = registerRes.value.asset;

    // Fetch media bytes and upload
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) {
      throw new Error(`Failed to fetch media for LinkedIn upload: ${mediaUrl}`);
    }
    const buffer = await mediaRes.arrayBuffer();

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type':
          mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        Authorization: `Bearer ${accessToken}`,
        ...uploadMechanism.headers,
      },
      body: buffer,
    });

    return asset;
  }

  private buildText(post: any): string {
    const parts: string[] = [post.content ?? ''];
    if (post.hashtags?.length) {
      parts.push(
        '\n\n' +
          (post.hashtags as string[]).map((h: string) => `#${h.replace(/^#/, '')}`).join(' '),
      );
    }
    if (post.link && !(post.mediaUrls?.length)) {
      parts.push(`\n\n${post.link}`);
    }
    return parts.join('').trim().substring(0, 3000);
  }
}
