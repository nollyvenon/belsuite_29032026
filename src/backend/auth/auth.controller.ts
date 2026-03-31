/**
 * Auth Controller
 * Handles all authentication endpoints: register, login, OAuth, 2FA, tokens,
 * password management, email verification, and session management.
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { OAuthService, OAuthProfile } from './services/oauth.service';
import { TwoFactorService } from './services/two-factor.service';
import {
  RegisterDto,
  LoginDto,
  TwoFactorDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import * as https from 'https';
import * as http from 'http';

/** Minimal typed user shape returned by JwtStrategy.validate */
interface AuthUser {
  id: string;
  email: string;
  orgId: string;
  permissions: string[];
  sessionId?: string;
}

// ── tiny HTTP helper (avoids adding axios as a dep) ──────────────────────────
function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function httpPost(url: string, body: Record<string, string>, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(body).toString();
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    };
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  // ── Registration / login ───────────────────────────────────────────────────

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.meta(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.meta(req));
  }

  // ── Token refresh ──────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto.refreshToken, this.meta(req));
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthUser) {
    if (user.sessionId) {
      await this.authService.logout(user.sessionId);
    }
  }

  @Post('logout/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: AuthUser) {
    await this.authService.logoutAll(user.id);
  }

  // ── Current user ───────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthUser) {
    return user;
  }

  // ── Two-Factor Authentication ──────────────────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@CurrentUser() user: AuthUser) {
    return this.twoFactorService.setupTOTP(user.id, user.email);
  }

  @Post('2fa/verify-setup')
  @UseGuards(JwtAuthGuard)
  async verifySetup2FA(@CurrentUser() user: AuthUser, @Body() body: { code: string }) {
    if (!body.code) throw new BadRequestException('code required');
    return this.twoFactorService.verifyTOTPSetup(user.id, body.code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async complete2FA(@Body() dto: TwoFactorDto, @Req() req: Request) {
    return this.authService.completeTwoFactorLogin(dto.twoFactorToken, dto.code, this.meta(req));
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async disable2FA(@CurrentUser() user: AuthUser) {
    await this.twoFactorService.disableTwoFactor(user.id);
  }

  @Get('2fa/backup-codes')
  @UseGuards(JwtAuthGuard)
  async getBackupCodes(@CurrentUser() user: AuthUser) {
    const remaining = await this.twoFactorService.getBackupCodes(user.id);
    return { remaining: remaining.length };
  }

  // ── Password management ────────────────────────────────────────────────────

  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('password/change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  // ── Email verification ─────────────────────────────────────────────────────

  @Post('email/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser() user: AuthUser) {
    await this.authService.sendEmailVerification(user.id);
  }

  // ── Session management ─────────────────────────────────────────────────────

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser() user: AuthUser) {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async revokeSession(@CurrentUser() user: AuthUser, @Param('sessionId') sessionId: string) {
    await this.authService.revokeSession(sessionId, user.id);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async authenticateGoogle(@Body() body: { code: string }, @Req() req: Request) {
    if (!body.code) throw new BadRequestException('Authorization code required');
    try {
      const profile = await this.exchangeGoogleCode(body.code, req);
      const result  = await this.oauthService.authenticateOAuth(profile);
      this.logger.log(`Google OAuth login: ${profile.email}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Google OAuth failed: ${(error as Error).message}`);
      throw new BadRequestException('Google authentication failed');
    }
  }

  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async authenticateApple(@Body() body: { code: string; idToken?: string }, @Req() req: Request) {
    if (!body.code && !body.idToken) throw new BadRequestException('Authorization code or ID token required');
    try {
      const profile = await this.exchangeAppleCode(body.code, body.idToken, req);
      const result  = await this.oauthService.authenticateOAuth(profile);
      this.logger.log(`Apple OAuth login: ${profile.email}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Apple OAuth failed: ${(error as Error).message}`);
      throw new BadRequestException('Apple authentication failed');
    }
  }

  @Post('oauth/facebook')
  @HttpCode(HttpStatus.OK)
  async authenticateFacebook(@Body() body: { code: string }, @Req() req: Request) {
    if (!body.code) throw new BadRequestException('Authorization code required');
    try {
      const profile = await this.exchangeFacebookCode(body.code, req);
      const result  = await this.oauthService.authenticateOAuth(profile);
      this.logger.log(`Facebook OAuth login: ${profile.email}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Facebook OAuth failed: ${(error as Error).message}`);
      throw new BadRequestException('Facebook authentication failed');
    }
  }

  // ── Private: OAuth code exchange ───────────────────────────────────────────

  private async exchangeGoogleCode(code: string, req: Request): Promise<OAuthProfile> {
    const body = await httpPost('https://oauth2.googleapis.com/token', {
      code,
      client_id:     process.env['GOOGLE_CLIENT_ID']     ?? '',
      client_secret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      redirect_uri:  process.env['GOOGLE_REDIRECT_URI']  ?? '',
      grant_type:    'authorization_code',
    });
    const { access_token } = JSON.parse(body);

    const userResp = await new Promise<string>((resolve, reject) => {
      https.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      } as any, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      }).on('error', reject);
    });

    const { id, email, name, picture } = JSON.parse(userResp);
    return {
      id, email, displayName: name, avatar: picture,
      provider: 'GOOGLE' as any, accessToken: access_token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      ...this.meta(req),
    };
  }

  private async exchangeAppleCode(code: string, idToken: string | undefined, req: Request): Promise<OAuthProfile> {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    const teamId     = process.env['APPLE_TEAM_ID']     ?? '';
    const keyId      = process.env['APPLE_KEY_ID']      ?? '';
    const clientId   = process.env['APPLE_CLIENT_ID']   ?? '';
    const privateKey = process.env['APPLE_PRIVATE_KEY'] ?? '';

    const secret = jwt.sign(
      { iss: teamId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'https://appleid.apple.com', sub: clientId },
      privateKey,
      { algorithm: 'ES256', keyid: keyId },
    );

    const body = await httpPost('https://appleid.apple.com/auth/token', {
      code,
      client_id: clientId, client_secret: secret,
      grant_type: 'authorization_code',
    });
    const { id_token } = JSON.parse(body);
    const token   = id_token || idToken;
    const decoded = jwt.decode(token) as { sub: string; email: string };

    return {
      id: decoded.sub, email: decoded.email ?? '', displayName: '',
      provider: 'APPLE' as any,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      ...this.meta(req),
    };
  }

  private async exchangeFacebookCode(code: string, req: Request): Promise<OAuthProfile> {
    const appId       = process.env['FACEBOOK_APP_ID']       ?? '';
    const appSecret   = process.env['FACEBOOK_APP_SECRET']   ?? '';
    const redirectUri = process.env['FACEBOOK_REDIRECT_URI'] ?? '';

    const tokenRaw = await httpGet(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    const { access_token } = JSON.parse(tokenRaw);

    const userRaw = await httpGet(
      `https://graph.facebook.com/v18.0/me?fields=id,email,name,picture.width(200).height(200)&access_token=${access_token}`,
    );
    const { id, email, name, picture } = JSON.parse(userRaw);

    return {
      id, email, displayName: name, avatar: picture?.data?.url,
      provider: 'FACEBOOK' as any, accessToken: access_token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      ...this.meta(req),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private meta(req: Request) {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }
}
