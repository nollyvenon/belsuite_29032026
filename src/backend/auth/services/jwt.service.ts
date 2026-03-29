/**
 * JWT Service
 * Handles JWT token creation, validation, and refresh token management
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh';
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
          expiresIn: expiryTime,
          secret: this.configService.get('JWT_SECRET'),
        },
      );
    } catch (error) {
      this.logger.error(`Failed to generate access token: ${error.message}`, error.stack);
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
          expiresIn: expiryTime,
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      );
    } catch (error) {
      this.logger.error(`Failed to generate refresh token: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
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
    } catch (error) {
      this.logger.debug(`Invalid access token: ${error.message}`);
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
    } catch (error) {
      this.logger.debug(`Invalid refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.error(`Failed to decode token: ${error.message}`);
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
