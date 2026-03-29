import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios } from 'axios';
import { AuthService } from './auth.service';
import { OAuthService } from './services/oauth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
    private configService: ConfigService,
  ) {}

  /**
   * POST /api/auth/register
   * Register new user
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/auth/login
   * Authenticate user and return tokens
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * GET /api/auth/me
   * Get current user profile (requires authentication)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user) {
    return user;
  }

  /**
   * POST /api/auth/oauth/google
   * Authenticate with Google OAuth
   */
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async authenticateGoogle(@Body() body: { code: string }) {
    const { code } = body;

    if (!code) {
      throw new BadRequestException('Authorization code required');
    }

    try {
      const profile = await this.exchangeGoogleCode(code);
      const result = await this.oauthService.authenticateOAuth(profile);

      this.logger.log(`Google OAuth login: ${profile.email}`);

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      this.logger.error(`Google OAuth failed: ${error.message}`);
      throw new BadRequestException('Google authentication failed');
    }
  }

  /**
   * POST /api/auth/oauth/apple
   * Authenticate with Apple OAuth
   */
  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async authenticateApple(@Body() body: { code: string; idToken?: string }) {
    const { code, idToken } = body;

    if (!code && !idToken) {
      throw new BadRequestException('Authorization code or ID token required');
    }

    try {
      const profile = await this.exchangeAppleCode(code, idToken);
      const result = await this.oauthService.authenticateOAuth(profile);

      this.logger.log(`Apple OAuth login: ${profile.email}`);

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      this.logger.error(`Apple OAuth failed: ${error.message}`);
      throw new BadRequestException('Apple authentication failed');
    }
  }

  /**
   * POST /api/auth/oauth/facebook
   * Authenticate with Facebook OAuth
   */
  @Post('oauth/facebook')
  @HttpCode(HttpStatus.OK)
  async authenticateFacebook(@Body() body: { code: string }) {
    const { code } = body;

    if (!code) {
      throw new BadRequestException('Authorization code required');
    }

    try {
      const profile = await this.exchangeFacebookCode(code);
      const result = await this.oauthService.authenticateOAuth(profile);

      this.logger.log(`Facebook OAuth login: ${profile.email}`);

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      this.logger.error(`Facebook OAuth failed: ${error.message}`);
      throw new BadRequestException('Facebook authentication failed');
    }
  }

  /**
   * Exchange Google authorization code for tokens
   */
  private async exchangeGoogleCode(code: string) {
    try {
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');

      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token, id_token } = response.data;

      // Get user info from Google
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, email, name, picture } = userResponse.data;

      return {
        id,
        email,
        displayName: name,
        avatar: picture,
        provider: 'GOOGLE',
        accessToken: access_token,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      };
    } catch (error) {
      this.logger.error(`Google code exchange failed: ${error.message}`);
      throw new BadRequestException('Failed to authenticate with Google');
    }
  }

  /**
   * Exchange Apple authorization code for tokens
   */
  private async exchangeAppleCode(code: string, idToken?: string) {
    try {
      const clientId = this.configService.get('APPLE_CLIENT_ID');
      const teamId = this.configService.get('APPLE_TEAM_ID');
      const keyId = this.configService.get('APPLE_KEY_ID');
      const privateKey = this.configService.get('APPLE_PRIVATE_KEY');

      // Generate client secret (JWT)
      const jwt = require('jsonwebtoken');
      const secret = jwt.sign(
        {
          iss: teamId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          aud: 'https://appleid.apple.com',
          sub: clientId,
        },
        privateKey,
        { algorithm: 'ES256', keyid: keyId },
      );

      const response = await axios.post('https://appleid.apple.com/auth/token', {
        code,
        client_id: clientId,
        client_secret: secret,
        grant_type: 'authorization_code',
      });

      const { access_token, id_token: newIdToken } = response.data;
      const token = newIdToken || idToken;

      // Decode ID token to get user info
      const decoded = jwt.decode(token);
      const { sub, email } = decoded;

      return {
        id: sub,
        email: email || '',
        displayName: '',
        avatar: '',
        provider: 'APPLE',
        accessToken: access_token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    } catch (error) {
      this.logger.error(`Apple code exchange failed: ${error.message}`);
      throw new BadRequestException('Failed to authenticate with Apple');
    }
  }

  /**
   * Exchange Facebook authorization code for tokens
   */
  private async exchangeFacebookCode(code: string) {
    try {
      const appId = this.configService.get('FACEBOOK_APP_ID');
      const appSecret = this.configService.get('FACEBOOK_APP_SECRET');
      const redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI');

      // Get access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,email,name,picture.width(200).height(200)',
          access_token,
        },
      });

      const { id, email, name, picture } = userResponse.data;

      return {
        id,
        email,
        displayName: name,
        avatar: picture?.data?.url,
        provider: 'FACEBOOK',
        accessToken: access_token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    } catch (error) {
      this.logger.error(`Facebook code exchange failed: ${error.message}`);
      throw new BadRequestException('Failed to authenticate with Facebook');
    }
  }
}
