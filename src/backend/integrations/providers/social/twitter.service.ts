import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { OAuthService }       from '../../oauth/oauth.service';
import { SocialPost, SocialPostResult } from '../../types/integration.types';
import * as crypto from 'crypto';

const API  = 'https://api.twitter.com/2';
const API1 = 'https://api.twitter.com/1.1';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(
    private readonly oauth:  OAuthService,
    private readonly config: ConfigService,
  ) {}

  // ── OAuth ────────────────────────────────────────────────────────────────

  async getAuthUrl(organizationId: string, userId?: string) {
    return this.oauth.buildAuthUrl(
      {
        provider:     'TWITTER',
        clientId:     this.config.get('TWITTER_CLIENT_ID') ?? '',
        clientSecret: this.config.get('TWITTER_CLIENT_SECRET') ?? '',
        authUrl:      'https://twitter.com/i/oauth2/authorize',
        tokenUrl:     'https://api.twitter.com/2/oauth2/token',
        scopes:       ['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'dm.read', 'dm.write'],
        redirectPath: '/api/integrations/twitter/callback',
      },
      organizationId,
      userId,
      { code_challenge_method: 'S256' },  // PKCE required for Twitter OAuth 2.0
    );
  }

  async handleCallback(code: string, state: string) {
    const { tokens, organizationId } = await this.oauth.exchangeCode(
      {
        provider:     'TWITTER',
        clientId:     this.config.get('TWITTER_CLIENT_ID') ?? '',
        clientSecret: this.config.get('TWITTER_CLIENT_SECRET') ?? '',
        authUrl:      'https://twitter.com/i/oauth2/authorize',
        tokenUrl:     'https://api.twitter.com/2/oauth2/token',
        scopes:       [],
        redirectPath: '/api/integrations/twitter/callback',
      },
      code, state,
    );

    const profile = await this.apiFetch('/users/me?user.fields=id,name,username,profile_image_url', tokens.accessToken);
    return this.oauth.saveConnection(organizationId, 'TWITTER', tokens, {
      accountId:   profile.data.id,
      accountName: profile.data.name,
      metadata:    { username: profile.data.username, profileImageUrl: profile.data.profile_image_url },
    } as any);
  }

  // ── Tweets ───────────────────────────────────────────────────────────────

  async publishTweet(
    organizationId: string,
    post: SocialPost,
  ): Promise<SocialPostResult> {
    const token = await this.getToken(organizationId);

    const body: any = { text: post.content };
    if (post.mediaUrls?.length) {
      const mediaIds = await Promise.all(
        post.mediaUrls.map(url => this.uploadMedia(organizationId, url)),
      );
      body.media = { media_ids: mediaIds };
    }

    const data = await this.apiFetch('/tweets', token, 'POST', body);
    return { postId: data.data.id, platform: 'TWITTER', publishedAt: new Date() };
  }

  async replyToTweet(
    organizationId: string,
    replyToId:      string,
    text:           string,
  ): Promise<SocialPostResult> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/tweets', token, 'POST', {
      text,
      reply: { in_reply_to_tweet_id: replyToId },
    });
    return { postId: data.data.id, platform: 'TWITTER', publishedAt: new Date() };
  }

  async deleteTweet(organizationId: string, tweetId: string): Promise<void> {
    const token = await this.getToken(organizationId);
    await this.apiFetch(`/tweets/${tweetId}`, token, 'DELETE');
  }

  async likeTweet(organizationId: string, tweetId: string): Promise<void> {
    const token  = await this.getToken(organizationId);
    const meData = await this.apiFetch('/users/me', token);
    await this.apiFetch(`/users/${meData.data.id}/likes`, token, 'POST', { tweet_id: tweetId });
  }

  async retweet(organizationId: string, tweetId: string): Promise<void> {
    const token  = await this.getToken(organizationId);
    const meData = await this.apiFetch('/users/me', token);
    await this.apiFetch(`/users/${meData.data.id}/retweets`, token, 'POST', { tweet_id: tweetId });
  }

  // ── Timeline & Search ────────────────────────────────────────────────────

  async getHomeTimeline(
    organizationId: string,
    maxResults = 20,
  ): Promise<any[]> {
    const token  = await this.getToken(organizationId);
    const meData = await this.apiFetch('/users/me', token);
    const data   = await this.apiFetch(
      `/users/${meData.data.id}/timelines/reverse_chronological?max_results=${maxResults}&tweet.fields=created_at,public_metrics`,
      token,
    );
    return data.data ?? [];
  }

  async searchTweets(
    organizationId: string,
    query:          string,
    maxResults = 20,
  ): Promise<any[]> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch(
      `/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id`,
      token,
    );
    return data.data ?? [];
  }

  async getTweetMetrics(organizationId: string, tweetId: string): Promise<any> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch(
      `/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
      token,
    );
    return data.data?.public_metrics ?? {};
  }

  // ── DMs ─────────────────────────────────────────────────────────────────

  async sendDM(organizationId: string, recipientId: string, text: string): Promise<string> {
    const token = await this.getToken(organizationId);
    const data  = await this.apiFetch('/dm_conversations', token, 'POST', {
      participant_id: recipientId,
      message:        { text },
    });
    return data.data?.dm_conversation_id;
  }

  // ── Media ────────────────────────────────────────────────────────────────

  private async uploadMedia(organizationId: string, imageUrl: string): Promise<string> {
    // Fetch image bytes first
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch media: ${imageUrl}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const token  = await this.getToken(organizationId);

    // Twitter v1.1 media upload
    const form = new URLSearchParams();
    form.append('media_data', buffer.toString('base64'));

    const res = await fetch(`${API1}/media/upload.json`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) throw new Error(`Twitter media upload ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return data.media_id_string;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getToken(organizationId: string): Promise<string> {
    const conn = await this.oauth.getConnection(organizationId, 'TWITTER');
    if (!conn) throw new Error('Twitter not connected');
    return this.oauth.refreshIfNeeded(conn.id, {
      provider:     'TWITTER',
      clientId:     this.config.get('TWITTER_CLIENT_ID') ?? '',
      clientSecret: this.config.get('TWITTER_CLIENT_SECRET') ?? '',
      authUrl:      'https://twitter.com/i/oauth2/authorize',
      tokenUrl:     'https://api.twitter.com/2/oauth2/token',
      scopes:       [],
      redirectPath: '/api/integrations/twitter/callback',
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
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Twitter API ${res.status}: ${await res.text()}`);
    if (method === 'DELETE') return {};
    return res.json();
  }
}
