import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtTokenService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { TwoFactorService } from './services/two-factor.service';
import { OAuthService } from './services/oauth.service';
import { SessionService } from './services/session.service';
import { PrismaService } from '../database/prisma.service';
import { AppConfig } from '../config/app.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [
    // Core
    AuthService,
    JwtStrategy,
    AppConfig,
    PrismaService,
    // Auth services
    JwtTokenService,
    PasswordService,
    TwoFactorService,
    OAuthService,
    SessionService,
  ],
  exports: [AuthService, JwtTokenService, SessionService, PasswordService],
})
export class AuthModule {}
