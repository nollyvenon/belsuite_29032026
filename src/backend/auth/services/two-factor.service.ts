/**
 * Two-Factor Authentication Service
 * Handles TOTP (Authenticator apps) and email-based 2FA
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TwoFactorMethod } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string; // Data URL for QR code
  backupCodes: string[];
}

export interface VerifyTwoFactorResult {
  verified: boolean;
  message?: string;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate TOTP secret and QR code for setup
   */
  async setupTOTP(userId: string, email: string): Promise<TwoFactorSetupResponse> {
    try {
      // Check if 2FA already exists
      const existing = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (existing?.isEnabled) {
        throw new BadRequestException('Two-factor authentication is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `BelSuite (${email})`,
        issuer: 'BelSuite',
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Hash backup codes before saving
      const hashedCodes = backupCodes.map(code => this.hashBackupCode(code));

      // Save to database (not enabled yet)
      if (existing) {
        // Update existing disabled 2FA
        await this.prisma.twoFactorSecret.update({
          where: { userId },
          data: {
            secret: this.encryptSecret(secret.base32),
            isEnabled: false,
            method: TwoFactorMethod.TOTP,
          },
        });

        // Clear old backup codes
        await this.prisma.twoFactorBackupCode.deleteMany({
          where: { twoFactorId: existing.id },
        });

        // Add new backup codes
        await this.prisma.twoFactorBackupCode.createMany({
          data: hashedCodes.map(code => ({
            twoFactorId: existing.id,
            code,
          })),
        });
      } else {
        // Create new 2FA secret
        const twoFactor = await this.prisma.twoFactorSecret.create({
          data: {
            userId,
            secret: this.encryptSecret(secret.base32),
            method: TwoFactorMethod.TOTP,
            isEnabled: false,
          },
        });

        // Add backup codes
        await this.prisma.twoFactorBackupCode.createMany({
          data: hashedCodes.map(code => ({
            twoFactorId: twoFactor.id,
            code,
          })),
        });
      }

      this.logger.log(`2FA setup initiated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      this.logger.error(`Failed to setup 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify TOTP code during 2FA setup
   */
  async verifyTOTPSetup(userId: string, code: string): Promise<VerifyTwoFactorResult> {
    try {
      const twoFactor = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (!twoFactor) {
        return { verified: false, message: 'Two-factor authentication not set up' };
      }

      const secret = this.decryptSecret(twoFactor.secret);

      // Verify TOTP code (allow 30 second window)
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (!verified) {
        return { verified: false, message: 'Invalid verification code' };
      }

      // Enable 2FA
      await this.prisma.twoFactorSecret.update({
        where: { userId },
        data: {
          isEnabled: true,
          enabledAt: new Date(),
        },
      });

      this.logger.log(`2FA enabled for user ${userId}`);

      return { verified: true, message: 'Two-factor authentication enabled' };
    } catch (error) {
      this.logger.error(`Failed to verify 2FA setup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTOTPLogin(userId: string, code: string): Promise<VerifyTwoFactorResult> {
    try {
      const twoFactor = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (!twoFactor?.isEnabled) {
        return { verified: false, message: 'Two-factor authentication not enabled' };
      }

      const secret = this.decryptSecret(twoFactor.secret);

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      return {
        verified,
        message: verified ? 'Code verified' : 'Invalid code',
      };
    } catch (error) {
      this.logger.error(`Failed to verify 2FA code: ${error.message}`, error.stack);
      return { verified: false, message: 'Error verifying code' };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<VerifyTwoFactorResult> {
    try {
      const twoFactor = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
        include: { backupCodes: true },
      });

      if (!twoFactor?.isEnabled) {
        return { verified: false, message: 'Two-factor authentication not enabled' };
      }

      // Find unused backup code
      const backupCode = twoFactor.backupCodes.find(
        bc => !bc.used && this.hashBackupCode(code) === bc.code,
      );

      if (!backupCode) {
        return { verified: false, message: 'Invalid backup code' };
      }

      // Mark code as used
      await this.prisma.twoFactorBackupCode.update({
        where: { id: backupCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      return { verified: true, message: 'Backup code verified' };
    } catch (error) {
      this.logger.error(`Failed to verify backup code: ${error.message}`, error.stack);
      return { verified: false, message: 'Error verifying backup code' };
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorSecret.findUnique({
      where: { userId },
      select: { isEnabled: true },
    });

    return twoFactor?.isEnabled || false;
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      const twoFactor = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (!twoFactor) {
        throw new BadRequestException('Two-factor authentication not set up');
      }

      // Delete 2FA and backup codes
      await this.prisma.twoFactorBackupCode.deleteMany({
        where: { twoFactorId: twoFactor.id },
      });

      await this.prisma.twoFactorSecret.delete({
        where: { userId },
      });

      this.logger.log(`2FA disabled for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to disable 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get backup codes for user
   */
  async getBackupCodes(userId: string): Promise<string[]> {
    try {
      const twoFactor = await this.prisma.twoFactorSecret.findUnique({
        where: { userId },
        include: {
          backupCodes: {
            where: { used: false },
            select: { id: true },
          },
        },
      });

      if (!twoFactor) {
        return [];
      }

      return twoFactor.backupCodes.map(bc => bc.id);
    } catch (error) {
      this.logger.error(`Failed to get backup codes: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      codes.push(this.generateRandomCode());
    }

    return codes;
  }

  /**
   * Generate random backup code
   */
  private generateRandomCode(): string {
    return crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
  }

  /**
   * Hash backup code
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Encrypt secret
   */
  private encryptSecret(secret: string): string {
    // In production, use proper encryption
    return Buffer.from(secret).toString('base64');
  }

  /**
   * Decrypt secret
   */
  private decryptSecret(encrypted: string): string {
    // In production, use proper decryption
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }
}
