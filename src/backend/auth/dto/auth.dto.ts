import { IsEmail, IsStrongPassword, IsNotEmpty, IsString } from 'class-validator';

/**
 * Register DTO
 * Validates user registration payload
 */
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;
}

/**
 * Login DTO
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

/**
 * JWT Payload (stored in token)
 */
export class JwtPayload {
  sub: string; // User ID
  email: string;
  orgId: string; // Organization ID
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * Auth Response
 */
export class AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
