/**
 * Multi-Provider Email Service
 * Handles failover and provider selection strategy
 */

import { Injectable, Logger } from '@nestjs/common';
import { EmailProviderFactory, EmailProviderType } from '../providers/email.provider.factory';
import { EmailSendOptions, EmailResponse, IEmailService } from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';

export interface MultiProviderConfig {
  primaryProvider: EmailProviderType;
  fallbackProviders: EmailProviderType[];
  maxRetries: number;
  retryDelay: number;
}

@Injectable()
export class MultiProviderEmailService implements IEmailService {
  private readonly logger = new Logger(MultiProviderEmailService.name);
  private config: MultiProviderConfig = {
    primaryProvider: (process.env.EMAIL_PROVIDER as EmailProviderType) || 'sendgrid',
    fallbackProviders: ['mailgun', 'postmark', 'ses'],
    maxRetries: 3,
    retryDelay: 5000,
  };

  constructor(
    private readonly providerFactory: EmailProviderFactory,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Send email with automatic failover
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    const providers = [
      this.config.primaryProvider,
      ...this.config.fallbackProviders,
    ];

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      for (const providerName of providers) {
        try {
          const provider = this.providerFactory.getProvider(providerName);
          const response = await provider.send(options);

          if (response.success) {
            this.logger.log(
              `Email sent successfully via ${providerName} (attempt ${attempt + 1})`,
            );
            return response;
          }

          // If not retryable, stop trying this provider
          if (!response.retryable) {
            this.logger.warn(`Non-retryable error from ${providerName}: ${response.error}`);
            continue;
          }
        } catch (error) {
          this.logger.error(
            `Error with ${providerName} (attempt ${attempt + 1}): ${error.message}`,
          );
        }
      }

      // Wait before retry
      if (attempt < this.config.maxRetries - 1) {
        this.logger.log(
          `Retrying after ${this.config.retryDelay}ms (attempt ${attempt + 2})`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
      }
    }

    // All providers and retries failed
    this.logger.error('All providers failed to send email');
    return {
      success: false,
      error: 'All email providers failed after retries',
      provider: 'multi-provider',
      timestamp: new Date(),
    };
  }

  /**
   * Send batch emails
   */
  async sendBatch(emails: EmailSendOptions[]): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    for (const email of emails) {
      const result = await this.send(email);
      results.push(result);
    }

    return results;
  }

  /**
   * Get email status
   */
  async getStatus(messageId: string) {
    const providers = this.providerFactory.getAllProviders();

    for (const provider of Object.values(providers)) {
      const status = await provider.getStatus(messageId);
      if (status) {
        return status;
      }
    }

    return null;
  }

  /**
   * Get health of all providers
   */
  async health() {
    const providers = this.providerFactory.getAllProviders();
    const results: Record<string, any> = {};

    for (const [name, provider] of Object.entries(providers)) {
      try {
        results[name] = await provider.health();
      } catch (error) {
        results[name] = {
          healthy: false,
          provider: name,
          timestamp: new Date(),
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Get provider recommendations
   */
  getProviderRecommendations(): Record<string, any> {
    const configured = this.providerFactory.getConfiguredProviders();

    return {
      primary: this.config.primaryProvider,
      fallbacks: this.config.fallbackProviders.filter((p) => configured.includes(p)),
      configured: configured,
      available: configured.length > 0,
    };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<MultiProviderConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Multi-provider configuration updated');
  }
}
