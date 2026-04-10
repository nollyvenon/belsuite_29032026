import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { OAuthService }       from '../../oauth/oauth.service';
import { SocialPost, SocialPostResult } from '../../types/integration.types';

const API = 'https://open.tiktokapis.com/v2';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);

  constructor(
    private readonly oauth:  OAuthService,
    private readonly config: ConfigService,
  ) {}

  // ── OAuth ────────────────────────────────────────────────────────────────

  async getAuthUrl(organizationId: string, userId?: string) {
    return this.oauth.buildAuthUrl(
      {
        provider:     'TIKTOK',
        clientId:     this.config.get('TIKTOK_CLIENT_KEY') ?? '',
        clientSecret: this.config.get('TIKTOK_CLIENT_SECRET') ?? '',
        authUrl:      'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl:     `${API}/oauth/token/`,
        scopes:       ['user.info.basic', 'video.list', 'video.upload', 'video.publish'],
        redirectPath: '/api/integrations/tiktok/callback',
      },
      organizationId,
      userId,
      { code_challenge_method: 'S256' },
    );
  }

  async handleCallback(code: string, state: string) {
    const { tokens, organizationId } = await this.oauth.exchangeCode(
      {
        provider:     'TIKTOK',
        clientId:     this.config.get('TIKTOK_CLIENT_KEY') ?? '',
        clientSecret: this.config.get('TIKTOK_CLIENT_SECRET') ?? '',
        authUrl:      'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl:     `${API}/oauth/token/`,
        scopes:       [],
        redirectPath: '/api/integrations/tiktok/callback',
      },
      code, state,
    );

    const profile = await this.apiFetch(
      '/user/info/?fields=open_id,display_name,avatar_url',
      tokens.accessToken,
    );

    return this.oauth.saveConnection('TIKTOK', tokens, {
      accountId:   profile.data?.user?.open_id,
      accountName: profile.data?.user?.display_name,
      metadata:    { avatarUrl: profile.data?.user?.avatar_url },
    } as any);
  }

  // ── User ─────────────────────────────────────────────────────────────────

  async getProfile(organizationId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count', token);
    return data.data?.user ?? {};
  }

  // ── Videos ───────────────────────────────────────────────────────────────

  async listVideos(
    organizationId: string,
    maxCount = 20,
  ): Promise<any[]> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/video/list/', token, 'POST', {
      fields:    ['id', 'title', 'video_description', 'duration', 'view_count', 'like_count', 'comment_count', 'share_count', 'create_time', 'cover_image_url'],
      max_count: maxCount,
    });
    return data.data?.videos ?? [];
  }

  async getVideoStats(organizationId: string, videoIds: string[]): Promise<any[]> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/video/query/', token, 'POST', {
      filters: { video_ids: videoIds },
      fields:  ['id', 'view_count', 'like_count', 'comment_count', 'share_count'],
    });
    return data.data?.videos ?? [];
  }

  // ── Video Upload (Direct Post) ───────────────────────────────────────────

  /**
   * Publish a video via URL (TikTok fetches from the URL directly).
   * For production use the chunked upload flow instead.
   */
  async publishVideo(
    organizationId: string,
    post:           SocialPost & { videoUrl: string; coverImageUrl?: string },
  ): Promise<SocialPostResult> {
    const token = await this.getToken(organizationId);

    // Step 1: init upload
    const init = await this.apiFetch('/post/publish/video/init/', token, 'POST', {
      post_info: {
        title:       post.content.slice(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet:  false,
        disable_stitch: false,
        disable_comment: false,
      },
      source_info: {
        source:    'PULL_FROM_URL',
        video_url: post.videoUrl,
        ...(post.coverImageUrl ? { cover_image_url: post.coverImageUrl } : {}),
      },
    });

    const publishId = init.data?.publish_id;
    if (!publishId) throw new Error('TikTok: no publish_id returned');

    return { postId: publishId, platform: 'TIKTOK', publishedAt: new Date() };
  }

  /**
   * Check the status of a published video.
   */
  async checkPublishStatus(organizationId: string, publishId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/post/publish/status/fetch/', token, 'POST', { publish_id: publishId });
    return data.data ?? {};
  }

  // ── Creator Info ─────────────────────────────────────────────────────────

  async getCreatorInfo(organizationId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/post/publish/creator_info/query/', token, 'POST', {});
    return data.data ?? {};
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getToken(organizationId: string): Promise<string> {
    const conn = await this.oauth.getConnection(organizationId, 'TIKTOK');
    if (!conn) throw new Error('TikTok not connected');
    return this.oauth.refreshIfNeeded(conn.id, {
      provider:     'TIKTOK',
      clientId:     this.config.get('TIKTOK_CLIENT_KEY') ?? '',
      clientSecret: this.config.get('TIKTOK_CLIENT_SECRET') ?? '',
      authUrl:      'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl:     `${API}/oauth/token/`,
      scopes:       [],
      redirectPath: '/api/integrations/tiktok/callback',
    });
  }

  private async apiFetch(
    path:   string,
    token:  string,
    method = 'GET',
    body?:  any,
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${API}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`TikTok API ${res.status}: ${await res.text()}`);
    return res.json();
  }
}
