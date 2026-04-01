import { IsEmail, IsStrongPassword, IsNotEmpty, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Register DTO
 */
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password!: string;

  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  organizationName?: string;
}

/**
 * Login DTO
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

/**
 * Two-factor completion DTO
 */
export class TwoFactorDto {
  @IsNotEmpty()
  @IsString()
  twoFactorToken!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;
}

/**
 * Refresh token DTO
 */
export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}

/**
 * Password reset request DTO
 */
export class RequestPasswordResetDto {
  @IsEmail()
  email!: string;
}

/**
 * Password reset DTO
 */
export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  newPassword!: string;
}

/**
 * Change password DTO
 */
export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @IsStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  newPassword!: string;
}

/**
 * Email verification DTO
 */
export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

/**
 * JWT Payload (stored in token)
 */
export class JwtPayload {
  sub!: string;
  email!: string;
  orgId!: string;
  permissions!: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Auth Response
 */
export class AuthResponse {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * OAuth Callback DTO
 */
export class OAuthCallbackDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  provider!: string;

  @IsOptional()
  @IsString()
  state?: string;
}

/**
 * MFA Methods enum
 */
export enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
}

/**
 * Setup 2FA DTO
 */
export class Setup2FADto {
  @IsNotEmpty()
  @IsString()
  method!: MFAMethod;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/**
 * Verify TOTP DTO
 */
export class VerifyTotpDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

/**
 * API Key Response
 */
export class ApiKeyResponse {
  id!: string;
  name!: string;
  key!: string; // Only shown on creation
  maskedKey?: string; // Partial key for display
  scope!: string;
  createdAt!: Date;
  expiresAt?: Date;
  lastUsed?: Date;
}

/**
 * Create API Key DTO
 */
export class CreateApiKeyDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  scope?: string;

  @IsOptional()
  expiresAt?: Date;
}

/**
 * Two Factor Pending Response (when MFA is required but not provided)
 */
export class TwoFactorPendingResponse {
  sessionId!: string;
  methods!: MFAMethod[];
  expiresIn!: number;
}

/**
 * Token Response
 */
export class TokenResponse {
  accessToken!: string;
  refreshToken?: string;
  expiresIn!: number;
  tokenType!: string;
}
