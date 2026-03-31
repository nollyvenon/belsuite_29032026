/**
 * OAuth Service
 * Handles OAuth provider integration (Google, Apple, Facebook)
 */

import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtTokenService } from './jwt.service';
import { SessionService } from './session.service';
import { OAuthProvider, User } from '@prisma/client';

export interface OAuthProfile {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  provider: OAuthProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface OAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
  isNewUser: boolean;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtTokenService,
    private readonly sessions: SessionService,
  ) {}

  /**
   * Authenticate or create user via OAuth
   */
  async authenticateOAuth(profile: OAuthProfile): Promise<OAuthLoginResponse> {
    try {
      let user: User;
      let isNewUser = false;

      // Find by provider ID
      const existingOAuth = await this.prisma.oAuthAccount.findFirst({
        where: {
          provider: profile.provider,
          providerUserId: profile.id,
        },
        include: { user: true },
      });

      if (existingOAuth) {
        // OAuth account exists, update tokens
        user = existingOAuth.user;
        await this.prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: {
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
            expiresAt: profile.expiresAt,
            displayName: profile.displayName,
            avatar: profile.avatar,
          },
        });
      } else {
        // Check if user exists by email
        const existingUser = await this.prisma.user.findUnique({
          where: { email: profile.email.toLowerCase() },
        });
        user = existingUser as User;

        if (user) {
          // User exists, create OAuth link
          await this.prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: profile.provider,
              providerUserId: profile.id,
              email: profile.email,
              displayName: profile.displayName,
              avatar: profile.avatar,
              accessToken: profile.accessToken,
              refreshToken: profile.refreshToken,
              expiresAt: profile.expiresAt,
            },
          });
        } else {
          // Create new user and OAuth link
          isNewUser = true;

          const newUser = await this.prisma.user.create({
            data: {
              email: profile.email.toLowerCase(),
              firstName: profile.displayName?.split(' ')[0],
              lastName: profile.displayName?.split(' ').slice(1).join(' '),
              avatar: profile.avatar,
              emailVerified: new Date(), // OAuth providers verify email
              status: 'ACTIVE',
              // Don't set passwordHash since this is OAuth-only account
              passwordHash: this.generatePlaceholderHash(),
            },
          });

          // Create OAuth link
          await this.prisma.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider: profile.provider,
              providerUserId: profile.id,
              email: profile.email,
              displayName: profile.displayName,
              avatar: profile.avatar,
              accessToken: profile.accessToken,
              refreshToken: profile.refreshToken,
              expiresAt: profile.expiresAt,
            },
          });

          user = newUser;
        }
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Load org + permissions
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        orderBy: { joinedAt: 'asc' },
        include: { role: { include: { permissions: true } } },
      });
      const orgId = member?.organizationId ?? '';
      const permissions = member?.role?.permissions?.map((p: { action: string; resource: string }) => `${p.action}:${p.resource}`) ?? [];

      // Create session + issue tokens
      const refreshExpiry = 7 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + refreshExpiry);
      const { refreshToken } = this.jwtService.generateTokenPair({ sub: user.id, email: user.email, orgId, permissions });

      const sessionId = await this.sessions.createSession({
        userId: user.id,
        organizationId: orgId,
        rawRefreshToken: refreshToken,
        expiresAt,
        ipAddress: profile.ipAddress,
        userAgent: profile.userAgent,
      });

      const accessToken = this.jwtService.generateAccessToken({
        sub: user.id, email: user.email, orgId, permissions, sessionId,
      });

      this.logger.log(`OAuth login: ${profile.provider} - ${user.email}`);

      return {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user),
        isNewUser,
      };
    } catch (error: unknown) {
      this.logger.error(`OAuth authentication failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccount(userId: string, profile: OAuthProfile): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if OAuth account already linked
      const existing = await this.prisma.oAuthAccount.findFirst({
        where: {
          provider: profile.provider,
          providerUserId: profile.id,
        },
      });

      if (existing) {
        throw new ConflictException(`${profile.provider} account already linked`);
      }

      // Create OAuth link
      await this.prisma.oAuthAccount.create({
        data: {
          userId,
          provider: profile.provider,
          providerUserId: profile.id,
          email: profile.email,
          displayName: profile.displayName,
          avatar: profile.avatar,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
        },
      });

      this.logger.log(`OAuth account linked: ${profile.provider} - ${userId}`);
    } catch (error: unknown) {
      this.logger.error(`OAuth link failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { oauthAccounts: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user has other auth methods
      const hasPassword = !!user.passwordHash || user.passwordHash !== this.generatePlaceholderHash();
      const otherOAuthAccounts = user.oauthAccounts.filter(oa => oa.provider !== provider);

      if (!hasPassword && otherOAuthAccounts.length === 0) {
        throw new BadRequestException(
          'Cannot unlink last authentication method. Set a password first.',
        );
      }

      // Delete OAuth account
      await this.prisma.oAuthAccount.deleteMany({
        where: {
          userId,
          provider,
        },
      });

      this.logger.log(`OAuth account unlinked: ${provider} - ${userId}`);
    } catch (error: unknown) {
      this.logger.error(`OAuth unlink failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get connected OAuth accounts for user
   */
  async getConnectedOAuthAccounts(userId: string) {
    try {
      const accounts = await this.prisma.oAuthAccount.findMany({
        where: { userId },
        select: {
          provider: true,
          displayName: true,
          avatar: true,
          email: true,
          createdAt: true,
        },
      });

      return accounts;
    } catch (error: unknown) {
      this.logger.error(`Failed to get OAuth accounts: ${(error as Error).message}`, (error as Error).stack);
      return [];
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(userId: string, provider: OAuthProvider): Promise<string> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
        },
      });

      if (!oauthAccount?.refreshToken) {
        throw new BadRequestException('No refresh token available');
      }

      // In production, call provider's token endpoint to refresh
      // For now, return existing accessToken
      return oauthAccount.accessToken ?? '';
    } catch (error: unknown) {
      this.logger.error(`OAuth token refresh failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate placeholder hash for OAuth-only accounts
   */
  private generatePlaceholderHash(): string {
    return 'oauth_account'; // No password set
  }

  /**
   * Sanitize user object
   */
  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
