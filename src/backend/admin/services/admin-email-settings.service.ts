/**
 * Admin Email Settings Service
 * Handles email provider configuration and management for administrators
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminEmailSettingsDto,
  UpdateEmailSettingsDto,
  EmailProviderConfigDto,
  TestEmailDto,
} from '../dtos/email-settings.dto';
import { EmailProviderFactory } from '../../email/providers/email.provider.factory';
import * as crypto from 'crypto';

@Injectable()
export class AdminEmailSettingsService {
  private readonly logger = new Logger(AdminEmailSettingsService.name);
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-minimum';

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: EmailProviderFactory,
  ) {}

  private getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  /**
   * Get email settings for organization
   */
  async getEmailSettings(organizationId: string): Promise<AdminEmailSettingsDto> {
    const settings = await this.prisma.adminEmailSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      // Return default settings
      return this.getDefaultSettings(organizationId);
    }

    // Decrypt sensitive fields before returning
    return this.decryptSettings(settings);
  }

  /**
   * Update email settings for organization
   */
  async updateEmailSettings(
    organizationId: string,
    dto: UpdateEmailSettingsDto,
  ): Promise<AdminEmailSettingsDto> {
    try {
      // Find or create settings
      let settings = await this.prisma.adminEmailSettings.findUnique({
        where: { organizationId },
      });

      if (!settings) {
        // Create new settings
        settings = await this.prisma.adminEmailSettings.create({
          data: {
            organizationId,
            ...this.prepareSettingsData(dto),
          },
        });
      } else {
        // Update existing settings
        settings = await this.prisma.adminEmailSettings.update({
          where: { organizationId },
          data: {
            ...this.prepareSettingsData(dto),
            updatedAt: new Date(),
          },
        });
      }

      this.logger.log(`Email settings updated for organization: ${organizationId}`);

      return this.decryptSettings(settings);
    } catch (error) {
      this.logger.error(
        `Failed to update email settings: ${this.getErrorMessage(error, 'Failed to update email settings')}`,
      );
      throw error;
    }
  }

  /**
   * Test email configuration by sending test email
   */
  async testEmailConfiguration(
    organizationId: string,
    dto: TestEmailDto,
  ): Promise<{ success: boolean; provider: string; message: string }> {
    try {
      const settings = await this.getEmailSettings(organizationId);

      const provider = this.providerFactory.getProvider(
        settings.primaryProvider as any,
      );

      // Test sending email
      const response = 'sendEmail' in provider
        ? await provider.sendEmail({
            to: { email: dto.testEmail },
            subject: 'Belsuite Email Configuration Test',
            htmlContent: `
              <h2>Email Configuration Test</h2>
              <p>If you received this email, your email provider is configured correctly!</p>
              <p><strong>Provider:</strong> ${settings.primaryProvider}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            `,
            textContent: `Email Configuration Test - Provider: ${settings.primaryProvider}`,
            metadata: { organizationId },
          })
        : await provider.send({
            to: dto.testEmail,
            subject: 'Belsuite Email Configuration Test',
            html: `
              <h2>Email Configuration Test</h2>
              <p>If you received this email, your email provider is configured correctly!</p>
              <p><strong>Provider:</strong> ${settings.primaryProvider}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            `,
            text: `Email Configuration Test - Provider: ${settings.primaryProvider}`,
            metadata: { organizationId },
          });

      if (('success' in response && response.success) || ('externalEmailId' in response)) {
        // Update last test status
        await this.prisma.adminEmailSettings.update({
          where: { organizationId },
          data: {
            lastTestedAt: new Date(),
            testStatus: 'SUCCESS',
          },
        });

        this.logger.log(
          `Email test successful for org ${organizationId} via ${settings.primaryProvider}`,
        );

        return {
          success: true,
          provider: settings.primaryProvider,
          message: `Test email sent successfully via ${settings.primaryProvider}`,
        };
      } else {
        await this.prisma.adminEmailSettings.update({
          where: { organizationId },
          data: {
            lastTestedAt: new Date(),
            testStatus: `FAILED: ${response.error}`,
          },
        });

        throw new Error(`Provider error: ${response.error}`);
      }
    } catch (error) {
      const message = this.getErrorMessage(error, 'Email test failed');
      this.logger.error(`Email test failed: ${message}`);

      await this.prisma.adminEmailSettings.update({
        where: { organizationId },
        data: {
          lastTestedAt: new Date(),
          testStatus: `FAILED: ${message}`,
        },
      }).catch(() => {
        // Ignore update error if settings don't exist yet
      });

      throw error;
    }
  }

  /**
   * Get available providers and their configuration requirements
   */
  async getAvailableProviders(): Promise<EmailProviderConfigDto[]> {
    return [
      {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Professional email delivery service',
        configFields: [
          {
            name: 'sendgridApiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            description: 'Your SendGrid API key',
          },
          {
            name: 'sendgridWebhookSecret',
            label: 'Webhook Secret',
            type: 'password',
            required: false,
            description: 'Optional webhook signature secret',
          },
          {
            name: 'sendgridDomain',
            label: 'Domain',
            type: 'text',
            required: false,
            description: 'Verified domain (optional)',
          },
        ],
        pricing: 'Pay-as-you-go',
        maxEmailsPerSecond: 100,
        features: ['Tracking', 'Webhooks', 'Templates', 'Batch sending'],
      },
      {
        id: 'mailgun',
        name: 'Mailgun',
        description: 'Email delivery platform',
        configFields: [
          {
            name: 'mailgunApiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            description: 'Your Mailgun API key',
          },
          {
            name: 'mailgunDomain',
            label: 'Domain',
            type: 'text',
            required: true,
            description: 'Your Mailgun domain',
          },
        ],
        pricing: 'Free tier + paid',
        maxEmailsPerSecond: 50,
        features: ['Tracking', 'Webhooks', 'Templates', 'Batch sending'],
      },
      {
        id: 'postmark',
        name: 'Postmark',
        description: 'Premium email API',
        configFields: [
          {
            name: 'postmarkApiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            description: 'Your Postmark Server Token',
          },
          {
            name: 'postmarkDomain',
            label: 'Domain',
            type: 'text',
            required: false,
            description: 'Sending domain (optional)',
          },
        ],
        pricing: 'Premium',
        maxEmailsPerSecond: 75,
        features: [
          'Tracking',
          'Webhooks',
          'Templates',
          'Batch sending',
          'High deliverability',
        ],
      },
      {
        id: 'ses',
        name: 'AWS SES',
        description: 'Amazon Simple Email Service',
        configFields: [
          {
            name: 'awsAccessKeyId',
            label: 'Access Key ID',
            type: 'password',
            required: true,
            description: 'Your AWS access key',
          },
          {
            name: 'awsSecretAccessKey',
            label: 'Secret Access Key',
            type: 'password',
            required: true,
            description: 'Your AWS secret key',
          },
          {
            name: 'awsRegion',
            label: 'Region',
            type: 'text',
            required: false,
            description: 'AWS region (default: us-east-1)',
          },
        ],
        pricing: 'AWS pricing',
        maxEmailsPerSecond: 200,
        features: ['Tracking', 'Webhooks', 'Cost-effective'],
      },
      {
        id: 'smtp',
        name: 'Generic SMTP',
        description: 'Any SMTP server (Gmail, Office 365, custom, etc.)',
        configFields: [
          {
            name: 'smtpHost',
            label: 'SMTP Host',
            type: 'text',
            required: true,
            description: 'e.g., smtp.gmail.com',
          },
          {
            name: 'smtpPort',
            label: 'Port',
            type: 'number',
            required: false,
            description: 'e.g., 587 (TLS) or 465 (SSL)',
          },
          {
            name: 'smtpSecure',
            label: 'Use SSL/TLS',
            type: 'boolean',
            required: false,
            description: 'true for port 465, false for 587',
          },
          {
            name: 'smtpUser',
            label: 'Username',
            type: 'text',
            required: true,
            description: 'SMTP username',
          },
          {
            name: 'smtpPassword',
            label: 'Password',
            type: 'password',
            required: true,
            description: 'SMTP password or app-specific password',
          },
        ],
        pricing: 'Depends on provider',
        maxEmailsPerSecond: 50,
        features: ['Universal compatibility', 'Works with most mail servers'],
      },
      {
        id: 'sendmail',
        name: 'Sendmail',
        description: 'Local system sendmail command',
        configFields: [
          {
            name: 'sendmailPath',
            label: 'Sendmail Path',
            type: 'text',
            required: false,
            description: 'Path to sendmail binary (default: /usr/sbin/sendmail)',
          },
        ],
        pricing: 'Free (system)',
        maxEmailsPerSecond: 50,
        features: ['Zero configuration', 'Local delivery', 'No external dependencies'],
      },
    ];
  }

  /**
   * Get configured providers (those with API keys set)
   */
  async getConfiguredProviders(organizationId: string): Promise<string[]> {
    const settings = await this.prisma.adminEmailSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      return [];
    }

    const configured: string[] = [];

    if (settings.sendgridApiKey) configured.push('sendgrid');
    if (settings.mailgunApiKey) configured.push('mailgun');
    if (settings.postmarkApiKey) configured.push('postmark');
    if (
      settings.awsAccessKeyId &&
      settings.awsSecretAccessKey
    ) configured.push('ses');
    if (settings.smtpHost) configured.push('smtp');
    if (settings.sendmailPath) configured.push('sendmail');

    return configured;
  }

  /**
   * Health check for email configuration
   */
  async checkEmailHealth(organizationId: string): Promise<{
    healthy: boolean;
    primaryProvider: string;
    configuredProviders: string[];
    lastTest: Date | null;
    testStatus: string | null;
  }> {
    const settings = await this.getEmailSettings(organizationId);
    const configured = await this.getConfiguredProviders(organizationId);

    return {
      healthy: configured.length > 0,
      primaryProvider: settings.primaryProvider,
      configuredProviders: configured,
      lastTest: settings.lastTestedAt ?? null,
      testStatus: settings.testStatus ?? null,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get default email settings
   */
  private getDefaultSettings(organizationId: string): AdminEmailSettingsDto {
    return {
      organizationId,
      primaryProvider: 'sendgrid',
      emailFrom: 'noreply@belsuite.com',
      emailFromName: 'Belsuite',
      enableFailover: true,
      fallbackProviders: ['mailgun', 'ses', 'postmark'],
      maxRetries: 3,
      retryDelayMs: 5000,
      rateLimitPerMinute: 100,
      rateLimitPerHour: 10000,
      trackingEnabled: true,
      webhooksEnabled: true,
      attachmentsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Prepare settings data - encrypt sensitive fields
   */
  private prepareSettingsData(dto: UpdateEmailSettingsDto): any {
    const data: any = {};

    // Encrypt sensitive fields
    if (dto.sendgridApiKey) {
      data.sendgridApiKey = this.encrypt(dto.sendgridApiKey);
    }
    if (dto.sendgridWebhookSecret) {
      data.sendgridWebhookSecret = this.encrypt(dto.sendgridWebhookSecret);
    }
    if (dto.mailgunApiKey) {
      data.mailgunApiKey = this.encrypt(dto.mailgunApiKey);
    }
    if (dto.awsAccessKeyId) {
      data.awsAccessKeyId = this.encrypt(dto.awsAccessKeyId);
    }
    if (dto.awsSecretAccessKey) {
      data.awsSecretAccessKey = this.encrypt(dto.awsSecretAccessKey);
    }
    if (dto.postmarkApiKey) {
      data.postmarkApiKey = this.encrypt(dto.postmarkApiKey);
    }
    if (dto.smtpPassword) {
      data.smtpPassword = this.encrypt(dto.smtpPassword);
    }

    // Copy non-sensitive fields
    if (dto.primaryProvider) data.primaryProvider = dto.primaryProvider;
    if (dto.sendgridDomain) data.sendgridDomain = dto.sendgridDomain;
    if (dto.mailgunDomain) data.mailgunDomain = dto.mailgunDomain;
    if (dto.awsRegion) data.awsRegion = dto.awsRegion;
    if (dto.postmarkDomain) data.postmarkDomain = dto.postmarkDomain;
    if (dto.smtpHost) data.smtpHost = dto.smtpHost;
    if (dto.smtpPort !== undefined) data.smtpPort = dto.smtpPort;
    if (dto.smtpSecure !== undefined) data.smtpSecure = dto.smtpSecure;
    if (dto.smtpUser) data.smtpUser = dto.smtpUser;
    if (dto.sendmailPath) data.sendmailPath = dto.sendmailPath;
    if (dto.emailFrom) data.emailFrom = dto.emailFrom;
    if (dto.emailFromName) data.emailFromName = dto.emailFromName;
    if (dto.replyTo) data.replyTo = dto.replyTo;
    if (dto.enableFailover !== undefined) data.enableFailover = dto.enableFailover;
    if (dto.fallbackProviders) data.fallbackProviders = dto.fallbackProviders;
    if (dto.maxRetries !== undefined) data.maxRetries = dto.maxRetries;
    if (dto.retryDelayMs !== undefined) data.retryDelayMs = dto.retryDelayMs;
    if (dto.rateLimitPerMinute !== undefined) {
      data.rateLimitPerMinute = dto.rateLimitPerMinute;
    }
    if (dto.rateLimitPerHour !== undefined) {
      data.rateLimitPerHour = dto.rateLimitPerHour;
    }
    if (dto.trackingEnabled !== undefined) data.trackingEnabled = dto.trackingEnabled;
    if (dto.webhooksEnabled !== undefined) data.webhooksEnabled = dto.webhooksEnabled;
    if (dto.attachmentsEnabled !== undefined) {
      data.attachmentsEnabled = dto.attachmentsEnabled;
    }

    return data;
  }

  /**
   * Decrypt sensitive fields
   */
  private decryptSettings(settings: any): AdminEmailSettingsDto {
    const decrypted: any = { ...settings };

    // Decrypt sensitive fields
    if (settings.sendgridApiKey) {
      decrypted.sendgridApiKey = this.decrypt(settings.sendgridApiKey);
    }
    if (settings.sendgridWebhookSecret) {
      decrypted.sendgridWebhookSecret = this.decrypt(settings.sendgridWebhookSecret);
    }
    if (settings.mailgunApiKey) {
      decrypted.mailgunApiKey = this.decrypt(settings.mailgunApiKey);
    }
    if (settings.awsAccessKeyId) {
      decrypted.awsAccessKeyId = this.decrypt(settings.awsAccessKeyId);
    }
    if (settings.awsSecretAccessKey) {
      decrypted.awsSecretAccessKey = this.decrypt(settings.awsSecretAccessKey);
    }
    if (settings.postmarkApiKey) {
      decrypted.postmarkApiKey = this.decrypt(settings.postmarkApiKey);
    }
    if (settings.smtpPassword) {
      decrypted.smtpPassword = this.decrypt(settings.smtpPassword);
    }

    return decrypted as AdminEmailSettingsDto;
  }

  /**
   * Encrypt sensitive value (simple encryption for basic security)
   */
  private encrypt(value: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'utf-8').subarray(0, 32),
        iv,
      );

      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.warn(
        `Encryption failed, storing plaintext: ${this.getErrorMessage(error, 'unknown error')}`,
      );
      return value;
    }
  }

  /**
   * Decrypt sensitive value
   */
  private decrypt(encrypted: string): string {
    try {
      const parts = encrypted.split(':');
      if (parts.length !== 2) return encrypted;

      const iv = Buffer.from(parts[0], 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'utf-8').subarray(0, 32),
        iv,
      );

      let decrypted = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.warn(
        `Decryption failed, returning as-is: ${this.getErrorMessage(error, 'unknown error')}`,
      );
      return encrypted;
    }
  }
}
