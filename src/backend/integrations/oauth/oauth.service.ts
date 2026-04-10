/**
 * OAuthService — core OAuth 2.0 orchestration
 *
 * Handles:
 *   - Authorization URL generation (PKCE + state)
 *   - Authorization code exchange
 *   - Token storage (AES-256-GCM encrypted at rest)
 *   - Automatic token refresh (called by provider services before every API call)
 *   - Connection CRUD
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService }   from '@nestjs/config';
import { PrismaService }   from '../../database/prisma.service';
import {
  OAuthConfig, TokenSet, IntegrationProvider, IntegrationConnection,
} from '../types/integration.types';
import * as crypto from 'crypto';

const STATE_TTL_MINUTES  = 10;
const REFRESH_BUFFER_MS  = 5 * 60 * 1000; // refresh 5 min before expiry

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly encKey: Buffer;

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {
    const secret = this.config.get<string>('INTEGRATION_ENCRYPTION_KEY')
      ?? this.config.get<string>('JWT_SECRET')
      ?? 'belsuite-default-key-change-in-prod';
    // Derive a 32-byte AES key from the secret
    this.encKey = crypto.createHash('sha256').update(secret).digest();
  }

  // ── Authorization URL ──────────────────────────────────────────────────

  async buildAuthUrl(
    cfg:            OAuthConfig,
    organizationId: string,
    userId?:        string,
    extra?:         Record<string, unknown>,
  ): Promise<{ url: string; state: string }> {
    const state        = crypto.randomBytes(24).toString('hex');
    const codeVerifier = cfg.usePKCE ? this.generatePKCEVerifier() : undefined;
    const expiresAt    = new Date(Date.now() + STATE_TTL_MINUTES * 60 * 1000);

    await this.prisma.oAuthState.create({
      data: {
        state, codeVerifier: codeVerifier ?? null,
        organizationId, userId: userId ?? null,
        provider: cfg.provider,
        redirectUri: cfg.redirectPath,
        metadata: extra as any ?? undefined,
        expiresAt,
      },
    });

    const params = new URLSearchParams({
      client_id:     cfg.clientId,
      redirect_uri:  this.buildRedirectUri(cfg.redirectPath),
      response_type: 'code',
      scope:         cfg.scopes.join(' '),
      state,
      access_type:   'offline',
      prompt:        'consent',
    });

    if (codeVerifier) {
      const challenge = this.buildPKCEChallenge(codeVerifier);
      params.set('code_challenge',        challenge);
      params.set('code_challenge_method', 'S256');
    }

    return { url: `${cfg.authUrl}?${params.toString()}`, state };
  }

  // ── Token exchange ─────────────────────────────────────────────────────

  async exchangeCode(
    cfg:  OAuthConfig,
    code: string,
    state: string,
  ): Promise<{ tokens: TokenSet; organizationId: string; userId?: string; metadata?: any }> {
    // Validate state
    const stateRecord = await this.prisma.oAuthState.findUnique({ where: { state } });
    if (!stateRecord || stateRecord.used || stateRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }
    if (stateRecord.provider !== cfg.provider) {
      throw new UnauthorizedException('OAuth state provider mismatch');
    }

    // Mark state as used
    await this.prisma.oAuthState.update({ where: { state }, data: { used: true } });

    // Exchange code for tokens
    const body = new URLSearchParams({
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  this.buildRedirectUri(cfg.redirectPath),
    });

    if (stateRecord.codeVerifier) {
      body.set('code_verifier', stateRecord.codeVerifier);
    }

    const res = await fetch(cfg.tokenUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body:    body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Token exchange failed for ${cfg.provider}: ${err}`);
    }

    const data = await res.json() as any;
    const tokens: TokenSet = {
      accessToken:   data.access_token,
      refreshToken:  data.refresh_token,
      expiresAt:     data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scopes:        (data.scope ?? cfg.scopes.join(' ')).split(/[\s,]+/),
      tokenType:     data.token_type,
    };

    return {
      tokens,
      organizationId: stateRecord.organizationId,
      userId:         stateRecord.userId ?? undefined,
      metadata:       stateRecord.metadata,
    };
  }

  // ── Token refresh ──────────────────────────────────────────────────────

  async refreshIfNeeded(
    connectionId: string,
    cfg:          OAuthConfig,
  ): Promise<string> {
    const conn = await this.prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn) throw new UnauthorizedException(`Connection ${connectionId} not found`);

    const needsRefresh = conn.tokenExpiresAt
      ? conn.tokenExpiresAt.getTime() - Date.now() < REFRESH_BUFFER_MS
      : false;

    if (!needsRefresh && conn.accessToken) {
      return this.decrypt(conn.accessToken);
    }

    if (!conn.refreshToken) {
      await this.markError(connectionId, 'No refresh token available — user must reconnect');
      throw new UnauthorizedException(`Integration ${cfg.provider} requires re-authentication`);
    }

    return this.performRefresh(connectionId, cfg, this.decrypt(conn.refreshToken));
  }

  private async performRefresh(
    connectionId:  string,
    cfg:           OAuthConfig,
    refreshToken:  string,
  ): Promise<string> {
    this.logger.debug(`Refreshing token for connection ${connectionId}`);

    const body = new URLSearchParams({
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    });

    const res = await fetch(cfg.tokenUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body:    body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      await this.markError(connectionId, `Refresh failed: ${err}`);
      throw new UnauthorizedException(`Token refresh failed for ${cfg.provider}: ${err}`);
    }

    const data = await res.json() as any;
    const newAccess    = data.access_token as string;
    const newRefresh   = data.refresh_token as string | undefined;
    const newExpiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined;

    await this.prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        accessToken:    this.encrypt(newAccess),
        refreshToken:   newRefresh ? this.encrypt(newRefresh) : undefined,
        tokenExpiresAt: newExpiresAt,
        status:         'ACTIVE',
        lastUsedAt:     new Date(),
      },
    });

    return newAccess;
  }

  // ── Connection storage ─────────────────────────────────────────────────

  async saveConnection(
    organizationId: string,
    provider:       IntegrationProvider,
    tokens:         TokenSet,
    account: {
      accountId?:     string;
      accountHandle?: string;
      accountName?:   string;
      accountEmail?:  string;
      accountAvatar?: string;
      metadata?:      Record<string, unknown>;
    },
  ): Promise<IntegrationConnection> {
    const data = {
      organizationId,
      provider,
      providerUserId: account.accountId ?? null,
      accessToken:    tokens.accessToken  ? this.encrypt(tokens.accessToken)  : null,
      refreshToken:   tokens.refreshToken ? this.encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt ?? null,
      scopes:         tokens.scopes ?? [],
      accountId:      account.accountId    ?? null,
      accountHandle:  account.accountHandle ?? null,
      accountName:    account.accountName   ?? null,
      accountEmail:   account.accountEmail  ?? null,
      accountAvatar:  account.accountAvatar ?? null,
      metadata:       account.metadata as any ?? undefined,
      status:         'ACTIVE',
      lastUsedAt:     new Date(),
    };

    const conn = await this.prisma.integrationConnection.upsert({
      where: {
        organizationId_provider_accountId: {
          organizationId,
          provider,
          accountId: account.accountId ?? '',
        },
      },
      update: data,
      create: data,
    });

    return this.toPublic(conn);
  }

  async getConnection(organizationId: string, provider: IntegrationProvider, accountId?: string) {
    return this.prisma.integrationConnection.findFirst({
      where: {
        organizationId,
        provider,
        ...(accountId ? { accountId } : {}),
        status: 'ACTIVE',
      },
    });
  }

  async listConnections(organizationId: string): Promise<IntegrationConnection[]> {
    const rows = await this.prisma.integrationConnection.findMany({
      where:   { organizationId },
      orderBy: { provider: 'asc' },
    });
    return rows.map(r => this.toPublic(r));
  }

  async revokeConnection(organizationId: string, provider: IntegrationProvider, accountId?: string): Promise<void> {
    await this.prisma.integrationConnection.updateMany({
      where: { organizationId, provider, ...(accountId ? { accountId } : {}) },
      data:  { status: 'REVOKED', accessToken: null, refreshToken: null },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private encrypt(plain: string): string {
    const iv         = crypto.randomBytes(12);
    const cipher     = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
    const encrypted  = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag        = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    const iv         = Buffer.from(ivHex,  'hex');
    const tag        = Buffer.from(tagHex, 'hex');
    const data       = Buffer.from(dataHex, 'hex');
    const decipher   = crypto.createDecipheriv('aes-256-gcm', this.encKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
  }

  private buildRedirectUri(path: string): string {
    const base = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    return `${base}${path}`;
  }

  private generatePKCEVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private buildPKCEChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  private async markError(connectionId: string, error: string): Promise<void> {
    await this.prisma.integrationConnection.update({
      where: { id: connectionId },
      data:  { status: 'ERROR', lastError: error, lastErrorAt: new Date() },
    }).catch(() => {});
  }

  private toPublic(conn: any): IntegrationConnection {
    return {
      id:             conn.id,
      organizationId: conn.organizationId,
      provider:       conn.provider,
      accountName:    conn.accountName,
      accountEmail:   conn.accountEmail,
      accountId:      conn.accountId,
      accountHandle:  conn.accountHandle,
      scopes:         conn.scopes ?? [],
      status:         conn.status,
      tokenExpiresAt: conn.tokenExpiresAt,
      lastUsedAt:     conn.lastUsedAt,
      metadata:       conn.metadata,
    };
  }
}
