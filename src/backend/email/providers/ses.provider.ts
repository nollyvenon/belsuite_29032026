/**
 * Amazon SES Email Provider
 * Implements IEmailService for AWS SES integration
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SESClient,
  SendEmailCommand,
  SendBulkTemplatedEmailCommand,
  GetAccountSendingEnabledCommand,
} from '@aws-sdk/client-ses';
import {
  EmailSendOptions,
  EmailResponse,
  EmailStatus,
  IEmailService,
} from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SESProvider implements IEmailService {
  private readonly logger = new Logger(SESProvider.name);
  private readonly client: SESClient;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly prisma: PrismaService) {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@belsuite.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Belsuite';

    this.client = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Send single email
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      const messageId = `ses_${uuid()}`;

      const destination: any = {
        ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
      };

      if (options.cc) {
        destination.CcAddresses = Array.isArray(options.cc) ? options.cc : [options.cc];
      }

      if (options.bcc) {
        destination.BccAddresses = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }

      const message: any = {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
      };

      if (options.html) {
        message.Body = message.Body || {};
        message.Body.Html = {
          Data: options.html,
          Charset: 'UTF-8',
        };
      }

      if (options.text) {
        message.Body = message.Body || {};
        message.Body.Text = {
          Data: options.text,
          Charset: 'UTF-8',
        };
      }

      // Note: SES doesn't support attachments through the standard SendEmailCommand
      // For attachments, you would need to use a library like nodemailer with SES transport
      if (options.attachments && options.attachments.length > 0) {
        this.logger.warn('SES does not support attachments via this API');
      }

      const command = new SendEmailCommand({
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: destination,
        Message: message,
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
        Tags: options.tags?.map((tag) => ({
          Name: 'category',
          Value: tag,
        })),
      });

      await this.client.send(command);

      this.logger.log(`Email sent via AWS SES: ${messageId}`);

      return {
        success: true,
        messageId,
        provider: 'ses',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: 'ses',
        timestamp: new Date(),
        retryable: this.isRetryable(error),
      };
    }
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
  async getStatus(messageId: string): Promise<EmailStatus | null> {
    try {
      const email = await this.prisma.email.findFirst({
        where: {
          externalEmailId: messageId,
          provider: 'SES',
        },
      });

      if (!email) {
        return null;
      }

      let status: EmailStatus['status'] = 'pending';
      if (email.bouncedAt) status = 'bounced';
      else if (email.spamReportedAt) status = 'failed';
      else if (email.clickedAt) status = 'clicked';
      else if (email.openedAt) status = 'opened';
      else if (email.deliveredAt) status = 'delivered';
      else if (email.sentAt) status = 'sent';

      return {
        messageId,
        status,
        timestamp: email.updatedAt,
        metadata: {
          email: email.toEmail,
          provider: 'ses',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get status: ${error.message}`);
      return null;
    }
  }

  /**
   * Check provider health
   */
  async health(): Promise<{ healthy: boolean; provider: string; timestamp: Date }> {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return {
          healthy: false,
          provider: 'ses',
          timestamp: new Date(),
        };
      }

      const command = new GetAccountSendingEnabledCommand({});
      await this.client.send(command);

      return {
        healthy: true,
        provider: 'ses',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        healthy: false,
        provider: 'ses',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify domain (not implemented for SES)
   */
  async verifyDomain(domain: string): Promise<boolean> {
    this.logger.warn('Domain verification must be done through AWS Console');
    return true;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: any): boolean {
    const retryableErrors = [
      'MessageRejected',
      'MailFromDomainNotVerified',
      'ThrottlingMaximumSendingRateExceeded',
    ];

    if (error.name && retryableErrors.includes(error.name)) {
      return true;
    }

    return false;
  }
}
