/**
 * Password Service
 * Handles password hashing, validation, and strength checking
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const zxcvbn: (password: string, userInputs?: string[]) => { score: number; feedback: { warning: string; suggestions: string[] } } = require('zxcvbn');

export interface PasswordStrength {
  score: number; // 0-4 (0=very weak, 4=very strong)
  feedback: string[];
  warning: string;
  isAcceptable: boolean;
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MIN_STRENGTH_SCORE = 2; // User-friendly password

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error: unknown) {
      this.logger.error(`Failed to hash password: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to process password');
    }
  }

  /**
   * Compare password with hash
   */
  async comparePasswords(plainPassword: string, hashPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashPassword);
    } catch (error: unknown) {
      this.logger.error(`Password comparison failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string, userInputs: string[] = []): PasswordStrength {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      return {
        score: 0,
        feedback: [`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters`],
        isAcceptable: false,
        warning: 'Too short',
      };
    }

    // Use zxcvbn for strength estimation
    const result = zxcvbn(password, userInputs);

    const isAcceptable = result.score >= this.MIN_STRENGTH_SCORE;
    const feedback = result.feedback.suggestions || [];

    if (result.feedback.warning) {
      feedback.push(result.feedback.warning);
    }

    return {
      score: result.score,
      feedback,
      isAcceptable,
      warning: result.feedback.warning || '',
    };
  }

  /**
   * Check if password meets requirements
   */
  meetsRequirements(password: string, userInputs: string[] = []): { meets: boolean; feedback: string[] } {
    const strength = this.validatePasswordStrength(password, userInputs);

    const issues: string[] = [];

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      issues.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters`);
    }

    if (!this.hasUpperCase(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    if (!this.hasLowerCase(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    if (!this.hasNumber(password)) {
      issues.push('Password must contain at least one number');
    }

    if (!this.hasSpecialChar(password)) {
      issues.push('Password must contain at least one special character (!@#$%^&*)');
    }

    if (!strength.isAcceptable) {
      issues.push(...strength.feedback);
    }

    return {
      meets: issues.length === 0,
      feedback: issues,
    };
  }

  /**
   * Generate a secure random password
   */
  generateRandomPassword(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  /**
   * Check if password has uppercase letters
   */
  private hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  /**
   * Check if password has lowercase letters
   */
  private hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  /**
   * Check if password has numbers
   */
  private hasNumber(password: string): boolean {
    return /[0-9]/.test(password);
  }

  /**
   * Check if password has special characters
   */
  private hasSpecialChar(password: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  /**
   * Generate temporary password for reset
   */
  generateTemporaryPassword(): string {
    return this.generateRandomPassword(12);
  }
}
