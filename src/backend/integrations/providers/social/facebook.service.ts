import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }  from '@nestjs/config';
import { OAuthService }   from '../../oauth/oauth.service';
import { SocialPost, SocialPostResult } from '../../types/integration.types';

const GRAPH = 'https://graph.facebook.com/v19.0';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    private readonly oauth:  OAuthService,
    private readonly config: ConfigService,
  ) {}

  async getAuthUrl(organizationId: string, userId?: string) {
    return this.oauth.buildAuthUrl(
      {
        provider:     'FACEBOOK',
        clientId:     this.config.get('FACEBOOK_APP_ID') ?? '',
        clientSecret: this.config.get('FACEBOOK_APP_SECRET') ?? '',
        authUrl:      'https://www.facebook.com/v19.0/dialog/oauth',
        tokenUrl:     `${GRAPH}/oauth/access_token`,
        scopes:       ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish', 'public_profile', 'email'],
        redirectPath: '/api/integrations/facebook/callback',
      },
      organizationId,
      userId,
    );
  }

  async handleCallback(code: string, state: string) {
    const { tokens, organizationId } = await this.oauth.exchangeCode(
      {
        provider:     'FACEBOOK',
        clientId:     this.config.get('FACEBOOK_APP_ID') ?? '',
        clientSecret: this.config.get('FACEBOOK_APP_SECRET') ?? '',
        authUrl:      'https://www.facebook.com/v19.0/dialog/oauth',
        tokenUrl:     `${GRAPH}/oauth/access_token`,
        scopes:       [],
        redirectPath: '/api/integrations/facebook/callback',
      },
      code, state,
    );

    // Fetch profile
    const profile = await this.apiFetch('/me?fields=id,name,email', tokens.accessToken);
    return this.oauth.saveConnection(organizationId, 'FACEBOOK', tokens, {
      accountId: profile.id, accountName: profile.name, accountEmail: profile.email,
    } as any);
  }

  async listPages(organizationId: string) {
    const conn = await this.getConn(organizationId);
    const data = await this.apiFetch('/me/accounts?fields=id,name,access_token,category', conn);
    return data.data ?? [];
  }

  async publishPost(
    organizationId: string,
    pageId:  string,
    post:    SocialPost,
  ): Promise<SocialPostResult> {
    const conn = await this.getConn(organizationId);

    // Get page-level token
    const pages = await this.listPages(organizationId);
    const page  = pages.find((p: any) => p.id === pageId);
    const token = page?.access_token ?? conn;

    const body: any = { message: post.content, access_token: token };
    if (post.scheduledAt) {
      body.scheduled_publish_time = Math.floor(post.scheduledAt.getTime() / 1000);
      body.published = false;
    }

    const data = await this.apiFetch(`/${pageId}/feed`, token, 'POST', body);

    return { postId: data.id, platform: 'FACEBOOK', publishedAt: post.scheduledAt };
  }

  async publishPhoto(
    organizationId: string,
    pageId:   string,
    imageUrl: string,
    caption:  string,
  ): Promise<SocialPostResult> {
    const pages = await this.listPages(organizationId);
    const page  = pages.find((p: any) => p.id === pageId);
    const conn  = await this.getConn(organizationId);
    const token = page?.access_token ?? conn;

    const data = await this.apiFetch(`/${pageId}/photos`, token, 'POST', {
      url: imageUrl, caption, access_token: token,
    });

    return { postId: data.id, platform: 'FACEBOOK' };
  }

  async getPageInsights(organizationId: string, pageId: string, metric: string, period = 'day') {
    const pages = await this.listPages(organizationId);
    const page  = pages.find((p: any) => p.id === pageId);
    const conn  = await this.getConn(organizationId);
    const token = page?.access_token ?? conn;
    return this.apiFetch(`/${pageId}/insights/${metric}?period=${period}`, token);
  }

  // ── Instagram (via Graph API) ──────────────────────────────────────────

  async publishInstagramPost(
    organizationId: string,
    igAccountId:    string,
    imageUrl:       string,
    caption:        string,
  ): Promise<SocialPostResult> {
    const conn = await this.getConn(organizationId);

    // Step 1: create media container
    const container = await this.apiFetch(`/${igAccountId}/media`, conn, 'POST', {
      image_url: imageUrl, caption, access_token: conn,
    });

    // Step 2: publish container
    const result = await this.apiFetch(`/${igAccountId}/media_publish`, conn, 'POST', {
      creation_id: container.id, access_token: conn,
    });

    return { postId: result.id, platform: 'FACEBOOK' };
  }

  private async getConn(organizationId: string): Promise<string> {
    const conn = await this.oauth.getConnection(organizationId, 'FACEBOOK');
    if (!conn) throw new Error('Facebook not connected');
    return this.oauth.refreshIfNeeded(conn.id, {
      provider: 'FACEBOOK', clientId: this.config.get('FACEBOOK_APP_ID') ?? '',
      clientSecret: this.config.get('FACEBOOK_APP_SECRET') ?? '',
      authUrl: '', tokenUrl: `${GRAPH}/oauth/access_token`,
      scopes: [], redirectPath: '/api/integrations/facebook/callback',
    });
  }

  private async apiFetch(
    path:   string,
    token:  string,
    method = 'GET',
    body?:  any,
  ): Promise<any> {
    const url      = path.startsWith('http') ? path : `${GRAPH}${path}`;
    const sep      = url.includes('?') ? '&' : '?';
    const fullUrl  = `${url}${sep}access_token=${token}`;

    const res = await fetch(fullUrl, {
      method,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Facebook API ${res.status}: ${await res.text()}`);
    return res.json();
  }
}
