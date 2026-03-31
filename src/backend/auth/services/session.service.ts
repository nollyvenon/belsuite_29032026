/**
 * Session Service
 * Manages refresh-token sessions, rotation, revocation, and device tracking.
 *
 * Design:
 *  - Each login creates a Session row whose `refreshTokenHash` = SHA-256 of the raw refresh token.
 *  - On every token refresh the old session is revoked and a new one is created (rotation).
 *  - Logout revokes the current session.
 *  - "Sign out all devices" revokes every session for the user.
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

export interface CreateSessionOptions {
  userId: string;
  organizationId: string;
  rawRefreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionView {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a new session on login */
  async createSession(opts: CreateSessionOptions): Promise<string> {
    const hash = this.hashToken(opts.rawRefreshToken);

    const session = await this.prisma.session.create({
      data: {
        userId: opts.userId,
        organizationId: opts.organizationId,
        refreshTokenHash: hash,
        expiresAt: opts.expiresAt,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
        isRevoked: false,
      },
    });

    // Async device session upsert (non-blocking — don't fail login on error)
    this.upsertDeviceSession(session.id, opts).catch((err) =>
      this.logger.warn(`Device session upsert failed: ${err.message}`),
    );

    this.logger.debug(`Session created: ${session.id} for user ${opts.userId}`);
    return session.id;
  }

  /**
   * Validate a raw refresh token.
   * Returns session id on success; throws UnauthorizedException on failure.
   */
  async validateAndConsumeRefreshToken(rawRefreshToken: string): Promise<{
    sessionId: string;
    userId: string;
    organizationId: string;
  }> {
    const hash = this.hashToken(rawRefreshToken);

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token not recognised');
    }

    if (session.isRevoked) {
      // Possible token reuse attack — revoke the whole family
      this.logger.warn(`Revoked refresh token reuse detected for user ${session.userId}`);
      await this.revokeAllSessions(session.userId, 'suspicious_reuse');
      throw new UnauthorizedException('Refresh token already revoked');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old session (rotation — one-time use)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'rotated' },
    });

    return {
      sessionId: session.id,
      userId: session.userId,
      organizationId: session.organizationId ?? '',
    };
  }

  /** Revoke a single session (logout) */
  async revokeSession(sessionId: string, reason = 'logout'): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });
    this.logger.debug(`Session revoked: ${sessionId} (${reason})`);
  }

  /** Revoke all sessions for a user (password change, admin, suspicious) */
  async revokeAllSessions(userId: string, reason = 'logout'): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });
    this.logger.log(`Revoked ${result.count} sessions for user ${userId} (${reason})`);
  }

  /** Revoke all except the current session (useful after password change) */
  async revokeOtherSessions(userId: string, currentSessionId: string, reason = 'logout'): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false, NOT: { id: currentSessionId } },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });
  }

  /** List active sessions for a user */
  async listActiveSessions(userId: string, currentSessionId?: string): Promise<SessionView[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 20,
    });

    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  /** Touch last-used timestamp */
  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, isRevoked: false },
      data: { lastUsedAt: new Date() },
    });
  }

  /** Clean up expired sessions (called by cron) */
  async purgeExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex').substring(0, 128);
  }

  private async upsertDeviceSession(
    sessionId: string,
    opts: CreateSessionOptions,
  ): Promise<void> {
    const ua = opts.userAgent ?? '';
    const ip = opts.ipAddress ?? 'unknown';

    // Basic device type detection
    const deviceType = /mobile|android|iphone|ipad/i.test(ua)
      ? 'MOBILE'
      : /tablet/i.test(ua)
      ? 'TABLET'
      : 'DESKTOP';

    await this.prisma.deviceSession.upsert({
      where: {
        userId_ipAddress_userAgent: {
          userId: opts.userId,
          ipAddress: ip,
          userAgent: ua.substring(0, 500),
        },
      },
      update: {
        lastActivityAt: new Date(),
        sessionId,
      },
      create: {
        userId: opts.userId,
        sessionId,
        ipAddress: ip,
        userAgent: ua.substring(0, 500),
        deviceType: deviceType as any,
        expiresAt: opts.expiresAt,
      },
    });
  }
}
