import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthService }  from '../../oauth/oauth.service';
import { OAuthConfig, IntegrationProvider } from '../../types/integration.types';

export const GOOGLE_SCOPES = {
  gmail:    ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.send'],
  calendar: ['https://www.googleapis.com/auth/calendar'],
  drive:    ['https://www.googleapis.com/auth/drive'],
  sheets:   ['https://www.googleapis.com/auth/spreadsheets'],
  profile:  ['openid', 'email', 'profile'],
};

export const ALL_GOOGLE_SCOPES = [
  ...GOOGLE_SCOPES.profile,
  ...GOOGLE_SCOPES.gmail,
  ...GOOGLE_SCOPES.calendar,
  ...GOOGLE_SCOPES.drive,
  ...GOOGLE_SCOPES.sheets,
];

@Injectable()
export class GoogleAuthService {
  private readonly cfg: OAuthConfig;

  constructor(
    private readonly oauth:   OAuthService,
    private readonly config:  ConfigService,
  ) {
    this.cfg = {
      provider:     'GOOGLE' as IntegrationProvider,
      clientId:     this.config.get<string>('GOOGLE_CLIENT_ID')     ?? '',
      clientSecret: this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl:     'https://oauth2.googleapis.com/token',
      scopes:       ALL_GOOGLE_SCOPES,
      redirectPath: '/api/integrations/google/callback',
      usePKCE:      false,
    };
  }

  async getAuthUrl(organizationId: string, userId?: string) {
    return this.oauth.buildAuthUrl(this.cfg, organizationId, userId);
  }

  async handleCallback(code: string, state: string) {
    const { tokens, organizationId, userId } = await this.oauth.exchangeCode(this.cfg, code, state);

    // Fetch Google profile
    const profile = await this.fetchProfile(tokens.accessToken);

    return this.oauth.saveConnection(organizationId, 'GOOGLE' as IntegrationProvider, tokens, {
      accountId:    profile.sub,
      accountEmail: profile.email,
      accountName:  profile.name,
      accountAvatar: profile.picture,
    } as any);
  }

  async getAccessToken(organizationId: string): Promise<string> {
    const conn = await this.oauth.getConnection(organizationId, 'GOOGLE');
    if (!conn) throw new Error('Google account not connected');
    return this.oauth.refreshIfNeeded(conn.id, this.cfg);
  }

  private async fetchProfile(accessToken: string): Promise<any> {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.json();
  }

  // Shared: authenticated Google API fetch
  async apiFetch(
    organizationId: string,
    url:    string,
    init?:  RequestInit,
  ): Promise<any> {
    const token = await this.getAccessToken(organizationId);
    const headers = { ...((init?.headers as any) ?? {}), Authorization: `Bearer ${token}` };
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google API ${res.status}: ${err}`);
    }
    return res.json();
  }
}
