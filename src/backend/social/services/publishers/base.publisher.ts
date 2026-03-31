/**
 * Base Platform Publisher
 * Abstract class for all social media platform publishers.
 * Provides AES-256-GCM token encryption/decryption.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { OAuthExchangeResult, OAuthTokens, PlatformPublishResult } from '../../types/social.types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

@Injectable()
export abstract class BasePlatformPublisher {
  protected readonly config: ConfigService;

  constructor(config: ConfigService) {
    this.config = config;
  }

  // ── Abstract contract ─────────────────────────────────────────────────────

  abstract publish(account: any, post: any): Promise<PlatformPublishResult>;

  abstract refreshToken(account: any): Promise<OAuthTokens>;

  abstract revokeToken(account: any): Promise<void>;

  abstract exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult>;

  // ── Encryption helpers ────────────────────────────────────────────────────

  /**
   * Derives a 32-byte key from env SOCIAL_ENCRYPTION_KEY or falls back to
   * the first 32 chars of JWT_SECRET (padded with zeros if shorter).
   */
  private getEncryptionKey(): Buffer {
    const raw =
      this.config.get<string>('SOCIAL_ENCRYPTION_KEY') ??
      (this.config.get<string>('JWT_SECRET') ?? '').substring(0, 32);

    // Normalise to exactly 32 bytes using SHA-256 so any length key works
    return crypto.createHash('sha256').update(raw).digest();
  }

  /**
   * Encrypts a plaintext token and returns a hex string:
   *   <12-byte IV><ciphertext><16-byte auth tag>
   */
  encryptToken(token: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, encrypted, tag]).toString('hex');
  }

  /**
   * Decrypts a hex string produced by encryptToken().
   */
  decryptToken(hex: string): string {
    const data = Buffer.from(hex, 'hex');
    const key = this.getEncryptionKey();

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(data.length - TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    return (
      decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8')
    );
  }

  // ── Shared HTTP helper ────────────────────────────────────────────────────

  protected async fetchJson<T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> {
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        (body as any)?.error?.message ??
        (body as any)?.error_description ??
        (body as any)?.message ??
        `HTTP ${res.status}`;
      throw new Error(`[${res.status}] ${msg}`);
    }

    return body as T;
  }
}
