import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { OAuthService }       from '../../oauth/oauth.service';
import { SocialPost, SocialPostResult } from '../../types/integration.types';

const API = 'https://api.linkedin.com/v2';

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  constructor(
    private readonly oauth:  OAuthService,
    private readonly config: ConfigService,
  ) {}

  // ── OAuth ────────────────────────────────────────────────────────────────

  async getAuthUrl(organizationId: string, userId?: string) {
    return this.oauth.buildAuthUrl(
      {
        provider:     'LINKEDIN',
        clientId:     this.config.get('LINKEDIN_CLIENT_ID') ?? '',
        clientSecret: this.config.get('LINKEDIN_CLIENT_SECRET') ?? '',
        authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
        scopes:       ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social', 'w_organization_social'],
        redirectPath: '/api/integrations/linkedin/callback',
      },
      organizationId,
      userId,
    );
  }

  async handleCallback(code: string, state: string) {
    const { tokens, organizationId } = await this.oauth.exchangeCode(
      {
        provider:     'LINKEDIN',
        clientId:     this.config.get('LINKEDIN_CLIENT_ID') ?? '',
        clientSecret: this.config.get('LINKEDIN_CLIENT_SECRET') ?? '',
        authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
        scopes:       [],
        redirectPath: '/api/integrations/linkedin/callback',
      },
      code, state,
    );

    const profile = await this.apiFetch('/me?projection=(id,localizedFirstName,localizedLastName)', tokens.accessToken);
    const emailData = await this.apiFetch(
      '/emailAddress?q=members&projection=(elements*(handle~))',
      tokens.accessToken,
    ).catch(() => null);
    const email = emailData?.elements?.[0]?.['handle~']?.emailAddress;

    return this.oauth.saveConnection(organizationId, 'LINKEDIN', tokens, {
      accountId:    profile.id,
      accountName:  `${profile.localizedFirstName} ${profile.localizedLastName}`,
      accountEmail: email,
    } as any);
  }

  // ── Profile ──────────────────────────────────────────────────────────────

  async getProfile(organizationId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    return this.apiFetch('/me?projection=(id,localizedFirstName,localizedLastName,profilePicture)', token);
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  async publishPost(
    organizationId: string,
    post:           SocialPost,
    authorUrn?:     string,  // person URN or organization URN
  ): Promise<SocialPostResult> {
    const token = await this.getToken(organizationId);

    // Resolve author URN
    let urn = authorUrn;
    if (!urn) {
      const profile = await this.apiFetch('/me', token);
      urn = `urn:li:person:${profile.id}`;
    }

    const body: any = {
      author:     urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary:    { text: post.content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add image/article if present
    if (post.mediaUrls?.length) {
      const assetUrns = await Promise.all(
        post.mediaUrls.map(url => this.uploadImage(organizationId, url, urn!)),
      );
      body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      body.specificContent['com.linkedin.ugc.ShareContent'].media = assetUrns.map(a => ({
        status: 'READY',
        media:  a,
      }));
    }

    const data = await this.apiFetch('/ugcPosts', token, 'POST', body);
    return { postId: data.id, platform: 'LINKEDIN', publishedAt: new Date() };
  }

  async deletePost(organizationId: string, postId: string): Promise<void> {
    const token = await this.getToken(organizationId);
    await this.apiFetch(`/ugcPosts/${encodeURIComponent(postId)}`, token, 'DELETE');
  }

  // ── Organizations ────────────────────────────────────────────────────────

  async listOrganizations(organizationId: string): Promise<any[]> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch(
      '/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,logoV2)))',
      token,
    );
    return (data.elements ?? []).map((e: any) => e['organization~']).filter(Boolean);
  }

  async publishOrgPost(
    organizationId: string,
    orgId:          string,
    post:           SocialPost,
  ): Promise<SocialPostResult> {
    return this.publishPost(organizationId, post, `urn:li:organization:${orgId}`);
  }

  async getOrgFollowers(organizationId: string, orgId: string): Promise<number> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch(
      `/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
      token,
    );
    return data.firstDegreeSize ?? 0;
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getPostStats(organizationId: string, postId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch(
      `/socialMetadata/${encodeURIComponent(postId)}`,
      token,
    );
    return {
      likes:    data.totalSocialActivityCounts?.numLikes ?? 0,
      comments: data.totalSocialActivityCounts?.numComments ?? 0,
      shares:   data.totalSocialActivityCounts?.numShares ?? 0,
    };
  }

  // ── Media upload ─────────────────────────────────────────────────────────

  private async uploadImage(organizationId: string, imageUrl: string, ownerUrn: string): Promise<string> {
    const token = await this.getToken(organizationId);

    // Step 1 — register upload
    const reg = await this.apiFetch('/assets?action=registerUpload', token, 'POST', {
      registerUploadRequest: {
        recipes:                ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner:                  ownerUrn,
        serviceRelationships:   [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    });

    const uploadUrl  = reg.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn   = reg.value.asset;

    // Step 2 — fetch & upload bytes
    const imgRes = await fetch(imageUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    await fetch(uploadUrl, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
      body:    buffer,
    });

    return assetUrn;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getToken(organizationId: string): Promise<string> {
    const conn = await this.oauth.getConnection(organizationId, 'LINKEDIN');
    if (!conn) throw new Error('LinkedIn not connected');
    return this.oauth.refreshIfNeeded(conn.id, {
      provider:     'LINKEDIN',
      clientId:     this.config.get('LINKEDIN_CLIENT_ID') ?? '',
      clientSecret: this.config.get('LINKEDIN_CLIENT_SECRET') ?? '',
      authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
      scopes:       [],
      redirectPath: '/api/integrations/linkedin/callback',
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
        Authorization:           `Bearer ${token}`,
        'Content-Type':          'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`LinkedIn API ${res.status}: ${await res.text()}`);
    if (method === 'DELETE' || res.status === 204) return {};
    return res.json();
  }
}
