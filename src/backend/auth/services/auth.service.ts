/**
 * Authentication Service
 * Core authentication logic: login, register, password management
 */

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';
import { JwtTokenService } from './jwt.service';
import { TwoFactorService } from './two-factor.service';
import { User } from '@prisma/client';
import * as crypto from 'crypto';

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string; // Temporary token for 2FA verification
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly PASSWORD_RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly EMAIL_VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtTokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<LoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Validate password strength
      const passwordCheck = this.passwordService.meetsRequirements(dto.password, [
        dto.email,
        dto.firstName || '',
        dto.lastName || '',
      ]);

      if (!passwordCheck.meets) {
        throw new BadRequestException({
          message: 'Password does not meet security requirements',
          feedback: passwordCheck.feedback,
        });
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(dto.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'PENDING_VERIFICATION',
        },
      });

      // Create organization if provided
      if (dto.organizationName) {
        await this.prisma.organization.create({
          data: {
            name: dto.organizationName,
            slug: this.generateSlug(dto.organizationName),
            members: {
              create: {
                userId: user.id,
                roleId: 'admin', // Assuming admin role exists
              },
            },
          },
        });
      }

      // Generate email verification token
      const verificationToken = await this.generateEmailVerificationToken(user.id, user.email);

      this.logger.log(`User registered: ${user.email}`);

      // Generate tokens
      const tokens = this.jwtService.generateTokenPair({
        sub: user.id,
        email: user.email,
      });

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    try {
      const email = dto.email.toLowerCase();

      // Check login attempts
      await this.checkLoginAttempts(email, dto.ipAddress || '');

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Record failed attempt
        await this.recordLoginAttempt(email, false, 'User not found', dto.ipAddress);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check account status
      if (user.status === 'BANNED') {
        await this.recordLoginAttempt(email, false, 'Account banned', dto.ipAddress);
        throw new UnauthorizedException('Account is disabled');
      }

      // Verify password
      const passwordValid = await this.passwordService.comparePasswords(
        dto.password,
        user.passwordHash,
      );

      if (!passwordValid) {
        await this.recordLoginAttempt(email, false, 'Invalid password', dto.ipAddress);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Record successful login attempt
      await this.recordLoginAttempt(email, true, undefined, dto.ipAddress);

      // Check if 2FA is enabled
      const has2FA = await this.twoFactorService.isTwoFactorEnabled(user.id);

      if (has2FA) {
        // Generate temporary 2FA token
        const twoFactorToken = this.jwtService.generateAccessToken(
          {
            sub: user.id,
            email: user.email,
          },
          '5m', // 5 minute expiry for 2FA verification
        );

        return {
          accessToken: '',
          refreshToken: '',
          user: this.sanitizeUser(user),
          requiresTwoFactor: true,
          twoFactorToken,
        };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate tokens
      const tokens = this.jwtService.generateTokenPair({
        sub: user.id,
        email: user.email,
      });

      this.logger.log(`User logged in: ${user.email}`);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Get fresh user data
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status === 'BANNED') {
        throw new UnauthorizedException('User not available');
      }

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair({
        sub: user.id,
        email: user.email,
      });

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      // Don't reveal if user exists
      if (!user) {
        this.logger.warn(`Password reset requested for non-existent user: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = await this.generatePasswordResetToken(user.id);

      // In production, send email with reset link
      this.logger.log(`Password reset token generated for user: ${user.email}`);

      // TODO: Send email with reset link: /auth/reset-password?token={resetToken}
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`, error.stack);
      // Don't throw to prevent email enumeration
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find reset token
      const resetToken = await this.prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!resetToken|| resetToken.usedAt || new Date() > resetToken.expiresAt) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Validate new password
      const passwordCheck = this.passwordService.meetsRequirements(newPassword);

      if (!passwordCheck.meets) {
        throw new BadRequestException({
          message: 'Password does not meet security requirements',
          feedback: passwordCheck.feedback,
        });
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: resetToken.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const passwordHash = await this.passwordService.hashPassword(newPassword);

      // Update password and mark token as used
      await Promise.all([
        this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      this.logger.log(`Password reset for user: ${user.email}`);
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify old password
      const oldPasswordValid = await this.passwordService.comparePasswords(
        oldPassword,
        user.passwordHash,
      );

      if (!oldPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      // Validate new password
      const passwordCheck = this.passwordService.meetsRequirements(newPassword, [user.email]);

      if (!passwordCheck.meets) {
        throw new BadRequestException({
          message: 'Password does not meet security requirements',
          feedback: passwordCheck.feedback,
        });
      }

      // Hash new password
      const passwordHash = await this.passwordService.hashPassword(newPassword);

      // Save to password history
      await this.prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        },
      });

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      this.logger.log(`Password changed for user: ${user.email}`);
    } catch (error) {
      this.logger.error(`Password change failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const verificationToken = await this.prisma.emailVerificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken || verificationToken.verifiedAt || new Date() > verificationToken.expiresAt) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      await Promise.all([
        this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { emailVerified: new Date(), status: 'ACTIVE' },
        }),
        this.prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { verifiedAt: new Date() },
        }),
      ]);

      this.logger.log(`Email verified for user: ${verificationToken.userId}`);
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check login attempts (rate limiting)
   */
  private async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.LOGIN_ATTEMPT_WINDOW);

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email,
        ipAddress,
        success: false,
        timestamp: { gte: windowStart },
      },
    });

    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new TooManyRequestsException(
        `Too many login attempts. Please try again in 15 minutes.`,
      );
    }
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(
    email: string,
    success: boolean,
    reason?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email,
          ipAddress: ipAddress || 'unknown',
          success,
          reason,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record login attempt: ${error.message}`);
    }
  }

  /**
   * Generate email verification token
   */
  private async generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.EMAIL_VERIFICATION_TOKEN_EXPIRY);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Generate password reset token
   */
  private async generatePasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_TOKEN_EXPIRY);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Sanitize user object
   */
  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 128);
  }
}

// Import for TooManyRequestsException
import { HttpStatus, HttpException } from '@nestjs/common';

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
