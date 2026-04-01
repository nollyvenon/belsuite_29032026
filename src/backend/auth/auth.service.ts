/**
 * Authentication Service (canonical)
 * Production-grade: login, register, 2FA, sessions, password, email verification.
 *
 * Flow summary
 * ─────────────
 * Login:
 *   1. Rate-limit by (email, IP) → check LoginAttempt table
 *   2. Look up user, verify bcrypt password
 *   3. Check account status (BANNED → reject)
 *   4. If 2FA enabled → return { requiresTwoFactor: true, twoFactorToken }
 *   5. Otherwise → create Session, issue access + refresh tokens
 *
 * 2FA completion:
 *   1. Verify twoFactorToken (short-lived JWT with type='2fa_pending')
 *   2. Verify TOTP code or backup code
 *   3. Create Session, issue full tokens
 *
 * Refresh:
 *   1. Hash incoming refresh token → look up Session
 *   2. Check not revoked + not expired
 *   3. Revoke old session (rotation)
 *   4. Create new session, issue new token pair
 *
 * Logout:
 *   1. Revoke current session by sessionId (from JWT claim)
 */

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';
import { TwoFactorService } from './services/two-factor.service';
import { SessionService } from './services/session.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
// User shape — matches Prisma model; replaced by @prisma/client after `prisma generate`
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  phoneNumber: string | null;
  timezone: string;
  preferredLanguage: string;
  status: string;
  lastLogin: Date | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
import * as crypto from 'crypto';

// ─── Local types ──────────────────────────────────────────────────────────────

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // seconds
}

interface AuthResponse extends TokenResponse {
  user: SafeUser;
}

interface TwoFactorPendingResponse {
  requiresTwoFactor: true;
  twoFactorToken: string;
  user: SafeUser;
}

type SafeUser = Omit<User, 'passwordHash'>;

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS    = 15 * 60 * 1000; // 15 min

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly passwords:     PasswordService,
    private readonly jwt:           JwtTokenService,
    private readonly twoFactor:     TwoFactorService,
    private readonly sessions:      SessionService,
  ) {}

  // ── Registration ───────────────────────────────────────────────────────────

  async register(dto: RegisterDto, meta: RequestMeta = {}): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    // Password strength
    const check = this.passwords.meetsRequirements(dto.password, [email, dto.firstName ?? '', dto.lastName ?? '']);
    if (!check.meets) {
      throw new BadRequestException({ message: 'Weak password', feedback: check.feedback });
    }

    const passwordHash = await this.passwords.hashPassword(dto.password);

     
    const { user, org } = await this.prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'PENDING_VERIFICATION',
        },
      });

      const orgName  = dto.organizationName ?? `${dto.firstName ?? email.split('@')[0]}'s Workspace`;
      const orgSlug  = this.generateSlug(orgName);

      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          email,
          status: 'ACTIVE',
          tier: 'FREE',
          isActive: true,
        },
      });

      // Admin role + full permissions
      const adminRole = await tx.role.create({
        data: { organizationId: newOrg.id, name: 'Admin', isSystem: true },
      });

      const defaultPerms = [
        'create:content', 'read:content', 'update:content', 'delete:content',
        'manage:users', 'manage:organization', 'manage:billing', 'manage:integrations',
        'manage:ai', 'manage:automation', 'read:analytics',
      ];

      await tx.permission.createMany({
        data: defaultPerms.map((p) => ({
          roleId: adminRole.id,
          action: p.split(':')[0],
          resource: p.split(':')[1],
        })),
      });

      // Viewer role (read-only)
      const viewerRole = await tx.role.create({
        data: { organizationId: newOrg.id, name: 'Viewer', isSystem: false },
      });
      await tx.permission.create({
        data: { roleId: viewerRole.id, action: 'read', resource: 'content' },
      });

      // Team Member role
      const memberRole = await tx.role.create({
        data: { organizationId: newOrg.id, name: 'Team Member', isSystem: false },
      });
      await tx.permission.createMany({
        data: [
          { roleId: memberRole.id, action: 'create', resource: 'content' },
          { roleId: memberRole.id, action: 'read', resource: 'content' },
          { roleId: memberRole.id, action: 'update', resource: 'content' },
        ],
      });

      await tx.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId: newUser.id,
          roleId: adminRole.id,
          status: 'ACTIVE',
          roleName: 'Admin',
          permissions: defaultPerms,
        },
      });

      // Onboarding + rate-limit quotas via tenant service (created implicitly by TenantService)
      await tx.tenantOnboarding.create({
        data: { organizationId: newOrg.id },
      });

      await tx.tenantRateLimitQuota.create({
        data: {
          organizationId: newOrg.id,
          apiRequestsPerMinute: 60,
          apiRequestsPerHour: 5000,
          aiTokensPerDay: 100000,
        },
      });

      return { user: newUser, org: newOrg };
    });

    // Email verification token (fire-and-forget)
    await this.generateEmailVerificationToken(user.id, email).catch((err) =>
      this.logger.warn(`Email verification token creation failed: ${err.message}`),
    );

    await this.recordLoginAttempt(email, true, undefined, meta.ipAddress);

    const permissions = await this.getUserPermissions(user.id, org.id);
    return this.issueTokens(user, org.id, permissions, meta);
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, meta: RequestMeta = {}): Promise<AuthResponse | TwoFactorPendingResponse> {
    const email = dto.email.toLowerCase().trim();

    // 1. Rate limiting by email+IP
    await this.enforceLoginRateLimit(email, meta.ipAddress ?? 'unknown');

    // 2. Find user
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      await this.recordLoginAttempt(email, false, 'user_not_found', meta.ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Check status before verifying password (still record attempt)
    if (user.status === 'BANNED') {
      await this.recordLoginAttempt(email, false, 'account_banned', meta.ipAddress);
      throw new UnauthorizedException('Account is disabled');
    }

    // 4. Verify password
    const valid = await this.passwords.comparePasswords(dto.password, user.passwordHash);
    if (!valid) {
      await this.recordLoginAttempt(email, false, 'invalid_password', meta.ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.recordLoginAttempt(email, true, undefined, meta.ipAddress);

    // 5. 2FA gate
    const has2fa = await this.twoFactor.isTwoFactorEnabled(user.id);
    if (has2fa) {
      const twoFactorToken = this.jwt.generate2faPendingToken(user.id, user.email);
      return { requiresTwoFactor: true, twoFactorToken, user: this.sanitize(user) };
    }

    // 6. Load org + permissions
    const orgId = await this.getPrimaryOrgId(user.id);
    if (!orgId) throw new UnauthorizedException('User has no organization');

    const permissions = await this.getUserPermissions(user.id, orgId);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    return this.issueTokens(user, orgId, permissions, meta);
  }

  // ── 2FA completion ─────────────────────────────────────────────────────────

  async completeTwoFactorLogin(
    twoFactorToken: string,
    code: string,
    meta: RequestMeta = {},
  ): Promise<AuthResponse> {
    // Verify the 2FA pending JWT
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verifyAccessToken(twoFactorToken) as any;
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    // Accept TOTP code OR backup code
    const totpResult   = await this.twoFactor.verifyTOTPLogin(user.id, code);
    const backupResult = totpResult.verified
      ? totpResult
      : await this.twoFactor.verifyBackupCode(user.id, code);

    if (!backupResult.verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const orgId = await this.getPrimaryOrgId(user.id);
    if (!orgId) throw new UnauthorizedException('User has no organization');

    const permissions = await this.getUserPermissions(user.id, orgId);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    return this.issueTokens(user, orgId, permissions, meta);
  }

  // ── Token refresh (rotation) ───────────────────────────────────────────────

  async refreshToken(rawRefreshToken: string, meta: RequestMeta = {}): Promise<TokenResponse & { user?: SafeUser }> {
    // 1. Validate JWT signature + type (throws if invalid/expired)
    this.jwt.verifyRefreshToken(rawRefreshToken);

    // 2. Validate against Session (detects revoked / replayed tokens)
    const { userId, organizationId } = await this.sessions.validateAndConsumeRefreshToken(rawRefreshToken);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'BANNED') {
      throw new UnauthorizedException('User unavailable');
    }

    const permissions = await this.getUserPermissions(userId, organizationId);

    // 3. Issue new token pair + create new session (rotation)
    return this.issueTokens(user, organizationId, permissions, meta);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revokeSession(sessionId, 'logout');
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAllSessions(userId, 'logout_all');
  }

  // ── Password management ────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Silent no-op for non-existent emails (prevent enumeration)
    if (!user) return;

    // Invalidate previous tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // TODO: inject EmailService and send email with link
    this.logger.log(`Password reset token issued for ${user.email} — send to email`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const check = this.passwords.meetsRequirements(newPassword);
    if (!check.meets) {
      throw new BadRequestException({ message: 'Weak password', feedback: check.feedback });
    }

    const user = await this.prisma.user.findUnique({ where: { id: resetToken.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check password history (last 5)
    await this.assertNotPasswordHistory(user.id, newPassword);

    const hash = await this.passwords.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordHistory.create({ data: { userId: user.id, passwordHash: hash } }),
    ]);

    // Revoke all sessions for security
    await this.sessions.revokeAllSessions(user.id, 'password_reset');
    this.logger.log(`Password reset: ${user.email}`);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await this.passwords.comparePasswords(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const check = this.passwords.meetsRequirements(newPassword, [user.email]);
    if (!check.meets) {
      throw new BadRequestException({ message: 'Weak password', feedback: check.feedback });
    }

    await this.assertNotPasswordHistory(user.id, newPassword);

    const hash = await this.passwords.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
      this.prisma.passwordHistory.create({ data: { userId, passwordHash: hash } }),
    ]);

    await this.sessions.revokeAllSessions(userId, 'password_change');
    this.logger.log(`Password changed: ${user.email}`);
  }

  // ── Email verification ─────────────────────────────────────────────────────

  async sendEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return; // already verified

    await this.generateEmailVerificationToken(user.id, user.email);
    this.logger.log(`Email verification resent for ${user.email}`);
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record || record.verifiedAt || new Date() > record.expiresAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date(), status: 'ACTIVE' },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified for user ${record.userId}`);
  }

  // ── Session management (delegated) ─────────────────────────────────────────

  async listSessions(userId: string, currentSessionId?: string) {
    return this.sessions.listActiveSessions(userId, currentSessionId);
  }

  async revokeSession(sessionId: string, requestingUserId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== requestingUserId) {
      throw new NotFoundException('Session not found');
    }
    await this.sessions.revokeSession(sessionId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async issueTokens(
    user: User,
    orgId: string,
    permissions: string[],
    meta: RequestMeta,
  ): Promise<AuthResponse> {
    const refreshExpiry = 7 * 24 * 60 * 60 * 1000;
    const expiresAt     = new Date(Date.now() + refreshExpiry);

    const tokens = this.jwt.generateTokenPair({ sub: user.id, email: user.email, orgId, permissions });

    const sessionId = await this.sessions.createSession({
      userId: user.id,
      organizationId: orgId,
      rawRefreshToken: tokens.refreshToken,
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    // Embed sessionId in access token (for logout without full token)
    const accessToken = this.jwt.generateAccessToken({
      sub: user.id, email: user.email, orgId, permissions, sessionId,
    });

    return {
      accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 15 * 60,
      user: this.sanitize(user),
    };
  }

  private async getPrimaryOrgId(userId: string): Promise<string | null> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { joinedAt: 'asc' },
      select: { organizationId: true },
    });
    return member?.organizationId ?? null;
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: { include: { permissions: true } } },
    });
    return member?.role?.permissions?.map((p: { action: string; resource: string }) => `${p.action}:${p.resource}`) ?? [];
  }

  private async enforceLoginRateLimit(email: string, ipAddress: string): Promise<void> {
    const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS);
    const count = await this.prisma.loginAttempt.count({
      where: { email, ipAddress, success: false, timestamp: { gte: windowStart } },
    });
    if (count >= MAX_LOGIN_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordLoginAttempt(
    email: string,
    success: boolean,
    reason?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.loginAttempt
      .create({ data: { email, ipAddress: ipAddress ?? 'unknown', success, reason } })
      .catch((err: Error) => this.logger.warn(`Login attempt log failed: ${err.message}`));
  }

  private async generateEmailVerificationToken(userId: string, email: string): Promise<void> {
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: { userId, email, token, expiresAt },
    });
    // TODO: send email with link /auth/verify-email?token={token}
  }

  private async assertNotPasswordHistory(userId: string, newPassword: string): Promise<void> {
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    for (const h of history) {
      const reused = await this.passwords.comparePasswords(newPassword, h.passwordHash);
      if (reused) {
        throw new BadRequestException('Password was used recently. Choose a different password.');
      }
    }
  }

  private sanitize(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  private generateSlug(name: string): string {
    const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);
    return `${base}-${Date.now().toString(36)}`;
  }
}
