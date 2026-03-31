/**
 * JWT Service
 * Handles JWT token creation, validation, and refresh token management
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;           // User ID
  email: string;
  orgId: string;         // Active organization ID
  permissions: string[]; // Cached permission strings e.g. ["create:content"]
  sessionId?: string;    // Session reference (access tokens)
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh' | '2fa_pending';
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token (short-lived)
   * Default expiry: 15 minutes
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string {
    const expiryTime = expiresIn || this.configService.get('JWT_ACCESS_EXPIRY') || '15m';

    try {
      return this.jwtService.sign(
        {
          ...payload,
          type: 'access',
        },
        {
          expiresIn: expiryTime as any,
          secret: this.configService.get('JWT_SECRET'),
        },
      );
    } catch (error: unknown) {
      this.logger.error(`Failed to generate access token: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token (long-lived)
   * Default expiry: 7 days
   */
  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string {
    const expiryTime = expiresIn || this.configService.get('JWT_REFRESH_EXPIRY') || '7d';

    try {
      return this.jwtService.sign(
        {
          ...payload,
          type: 'refresh',
        },
        {
          expiresIn: expiryTime as any,
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      );
    } catch (error: unknown) {
      this.logger.error(`Failed to generate refresh token: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens (full payload with orgId + permissions)
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Generate a short-lived token for 2FA pending state
   * Contains no permissions — only used to complete 2FA flow
   */
  generate2faPendingToken(userId: string, email: string): string {
    return this.generateAccessToken({ sub: userId, email, orgId: '', permissions: [] }, '5m');
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      }) as JwtPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error: unknown) {
      this.logger.debug(`Invalid access token: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error: unknown) {
      this.logger.debug(`Invalid refresh token: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error: unknown) {
      this.logger.error(`Failed to decode token: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (payload?.exp) {
      return new Date(payload.exp * 1000);
    }
    return null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return new Date() > expiration;
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiration(token: string): number {
    const payload = this.decodeToken(token);
    if (payload?.exp) {
      return Math.floor(payload.exp - Date.now() / 1000);
    }
    return 0;
  }
}
