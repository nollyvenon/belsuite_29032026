/**
 * Social Account Service
 * Manages connecting, disconnecting, and listing social media accounts.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { TwitterPublisher } from './publishers/twitter.publisher';
import { TikTokPublisher } from './publishers/tiktok.publisher';
import { LinkedInPublisher } from './publishers/linkedin.publisher';
import { PinterestPublisher } from './publishers/pinterest.publisher';
import { WhatsAppPublisher } from './publishers/whatsapp.publisher';
import { BasePlatformPublisher } from './publishers/base.publisher';
import { OAuthTokens } from '../types/social.types';

@Injectable()
export class SocialAccountService {
  private readonly logger = new Logger(SocialAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instagram: InstagramPublisher,
    private readonly facebook: FacebookPublisher,
    private readonly twitter: TwitterPublisher,
    private readonly tiktok: TikTokPublisher,
    private readonly linkedin: LinkedInPublisher,
    private readonly pinterest: PinterestPublisher,
    private readonly whatsapp: WhatsAppPublisher,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  async connectAccount(
    orgId: string,
    userId: string,
    platform: SocialPlatform,
    code: string,
    redirectUri: string,
  ) {
    const publisher = this.getPublisher(platform);
    const tokens = await publisher.exchangeCode(code, redirectUri);

    const encryptedAccess = publisher.encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? publisher.encryptToken(tokens.refreshToken)
      : null;

    const account = await this.prisma.socialAccount.upsert({
      where: {
        organizationId_platform_platformUserId: {
          organizationId: orgId,
          platform,
          platformUserId: tokens.platformUserId,
        },
      },
      create: {
        organizationId: orgId,
        userId,
        platform,
        platformUserId: tokens.platformUserId,
        platformUsername: tokens.displayName ?? '',
        displayName: tokens.displayName ?? '',
        avatar: tokens.avatar ?? null,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expiresAt ?? null,
        scope: tokens.scope ?? null,
        pageId: tokens.pageId ?? null,
        pageName: tokens.pageName ?? null,
        isActive: true,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expiresAt ?? null,
        scope: tokens.scope ?? null,
        displayName: tokens.displayName ?? '',
        avatar: tokens.avatar ?? null,
        pageId: tokens.pageId ?? null,
        pageName: tokens.pageName ?? null,
        isActive: true,
        userId,
      },
    });

    this.logger.log(`Connected ${platform} account ${account.id} for org ${orgId}`);
    return this.sanitizeAccount(account);
  }

  async disconnectAccount(orgId: string, accountId: string): Promise<void> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, organizationId: orgId },
    });

    if (!account) {
      throw new NotFoundException(`Social account ${accountId} not found`);
    }

    // Best-effort token revocation
    try {
      const publisher = this.getPublisher(account.platform);
      await publisher.revokeToken(account);
    } catch (err) {
      this.logger.warn(
        `Token revocation failed for account ${accountId}: ${(err as Error).message}`,
      );
    }

    await this.prisma.socialAccount.delete({ where: { id: accountId } });
    this.logger.log(`Disconnected account ${accountId}`);
  }

  async listAccounts(orgId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return accounts.map((a) => this.sanitizeAccount(a));
  }

  async getPublisherForAccount(accountId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);
    return this.getPublisher(account.platform);
  }

  async refreshAccountToken(accountId: string): Promise<void> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    const publisher = this.getPublisher(account.platform);
    let tokens: OAuthTokens;

    try {
      tokens = await publisher.refreshToken(account);
    } catch (err) {
      this.logger.error(
        `Token refresh failed for ${accountId}: ${(err as Error).message}`,
      );
      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });
      throw err;
    }

    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: publisher.encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken
          ? publisher.encryptToken(tokens.refreshToken)
          : undefined,
        tokenExpiresAt: tokens.expiresAt ?? null,
      },
    });

    this.logger.log(`Refreshed token for account ${accountId}`);
  }

  async getDecryptedAccount(accountId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    const publisher = this.getPublisher(account.platform);

    return {
      ...account,
      accessToken: publisher.decryptToken(account.accessToken),
      refreshToken: account.refreshToken
        ? publisher.decryptToken(account.refreshToken)
        : null,
    };
  }

  getPublisher(platform: SocialPlatform): BasePlatformPublisher {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return this.instagram;
      case SocialPlatform.FACEBOOK:
        return this.facebook;
      case SocialPlatform.TWITTER:
        return this.twitter;
      case SocialPlatform.TIKTOK:
        return this.tiktok;
      case SocialPlatform.LINKEDIN:
        return this.linkedin;
      case SocialPlatform.PINTEREST:
        return this.pinterest;
      case SocialPlatform.WHATSAPP:
        return this.whatsapp;
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  getOAuthUrl(platform: SocialPlatform, redirectUri: string, state: string): string {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return this.instagram.getAuthorizationUrl(redirectUri, state);
      case SocialPlatform.FACEBOOK:
        return this.facebook.getAuthorizationUrl(redirectUri, state);
      case SocialPlatform.TWITTER:
        // PKCE challenge is generated by caller for Twitter
        return this.twitter.getAuthorizationUrl(redirectUri, state, state);
      case SocialPlatform.TIKTOK:
        return this.tiktok.getAuthorizationUrl(redirectUri, state);
      case SocialPlatform.LINKEDIN:
        return this.linkedin.getAuthorizationUrl(redirectUri, state);
      case SocialPlatform.PINTEREST:
        return this.pinterest.getAuthorizationUrl(redirectUri, state);
      case SocialPlatform.WHATSAPP:
        return this.whatsapp.getAuthorizationUrl(redirectUri, state);
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  // ── WhatsApp recipients management ───────────────────────────────────────

  async getWhatsAppRecipients(orgId: string, accountId: string): Promise<string[]> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, organizationId: orgId, platform: 'WHATSAPP' },
    });
    if (!account) throw new NotFoundException(`WhatsApp account ${accountId} not found`);
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    return Array.isArray(meta['whatsappRecipients']) ? (meta['whatsappRecipients'] as string[]) : [];
  }

  async setWhatsAppRecipients(
    orgId: string,
    accountId: string,
    recipients: string[],
  ): Promise<{ recipients: string[] }> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, organizationId: orgId, platform: 'WHATSAPP' },
    });
    if (!account) throw new NotFoundException(`WhatsApp account ${accountId} not found`);

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    const invalid = recipients.filter((r) => !e164Regex.test(r));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid E.164 numbers: ${invalid.join(', ')}. Numbers must start with + and country code.`,
      );
    }

    const existing = (account.metadata as Record<string, unknown>) ?? {};
    const updated = await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        metadata: { ...existing, whatsappRecipients: recipients },
      },
    });

    const meta = (updated.metadata as Record<string, unknown>) ?? {};
    return { recipients: Array.isArray(meta['whatsappRecipients']) ? (meta['whatsappRecipients'] as string[]) : [] };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private sanitizeAccount(account: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...safe } = account;
    return safe;
  }
}
