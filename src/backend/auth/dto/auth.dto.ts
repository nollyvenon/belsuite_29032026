import { IsEmail, IsStrongPassword, IsNotEmpty, IsString, IsOptional } from 'class-validator';

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
