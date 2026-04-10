/**
 * Sendmail Email Provider
 * Implements IEmailService using system sendmail command
 */

import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  EmailSendOptions,
  EmailResponse,
  EmailStatus,
  IEmailService,
} from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuid } from 'uuid';

const execPromise = promisify(exec);

@Injectable()
export class SendmailProvider implements IEmailService {
  private readonly logger = new Logger(SendmailProvider.name);
  private readonly sendmailPath: string;

  constructor(private readonly prisma: PrismaService) {
    this.sendmailPath = process.env.SENDMAIL_PATH || '/usr/sbin/sendmail';
  }

  /**
   * Send single email
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      const messageId = `sendmail_${uuid()}`;

      // Build email headers and body
      const emailContent = this.buildEmailContent(options, messageId);

      // Prepare recipients
      const recipients = Array.isArray(options.to)
        ? options.to.join(' ')
        : options.to;

      // Send via sendmail command
      const command = `echo "${emailContent}" | ${this.sendmailPath} ${recipients}`;

      await execPromise(command);

      this.logger.log(`Email sent via Sendmail: ${messageId}`);

      const organizationId =
        typeof options.metadata?.organizationId === 'string'
          ? options.metadata.organizationId
          : null;

      if (organizationId) {
        await this.prisma.email.create({
          data: {
            organizationId,
            externalEmailId: messageId,
            provider: 'SENDMAIL',
            toEmail: Array.isArray(options.to) ? options.to.join(',') : options.to,
            subject: options.subject,
            sentAt: new Date(),
          },
        });
      }

      return {
        success: true,
        messageId,
        provider: 'sendmail',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: 'sendmail',
        timestamp: new Date(),
        retryable: this.isRetryable(error),
      };
    }
  }

  /**
   * Send batch emails
   */
  async sendBatch(emails: EmailSendOptions[]): Promise<EmailResponse[]> {
    try {
      const results: EmailResponse[] = [];

      for (const email of emails) {
        const result = await this.send(email);
        results.push(result);
      }

      return results;
    } catch (error) {
      this.logger.error(`Batch send failed: ${error.message}`);

      return emails.map(() => ({
        success: false,
        error: error.message,
        provider: 'sendmail',
        timestamp: new Date(),
        retryable: this.isRetryable(error),
      }));
    }
  }

  /**
   * Get email status
   */
  async getStatus(messageId: string): Promise<EmailStatus | null> {
    try {
      const email = await this.prisma.email.findFirst({
        where: {
          externalEmailId: messageId,
          provider: 'SENDMAIL',
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
          provider: 'sendmail',
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
      // Check if sendmail binary exists and is executable
      await execPromise(`test -x ${this.sendmailPath}`);

      return {
        healthy: true,
        provider: 'sendmail',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        healthy: false,
        provider: 'sendmail',
        timestamp: new Date(),
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Build email content with headers and body
   */
  private buildEmailContent(options: EmailSendOptions, messageId: string): string {
    const fromEmail = process.env.EMAIL_FROM || 'noreply@belsuite.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Belsuite';

    let content = '';

    // Headers
    content += `From: "${fromName}" <${fromEmail}>\r\n`;
    content += `To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}\r\n`;
    content += `Subject: ${options.subject}\r\n`;
    content += `Message-ID: <${messageId}@belsuite.local>\r\n`;
    content += `Date: ${new Date().toUTCString()}\r\n`;

    if (options.cc) {
      content += `Cc: ${Array.isArray(options.cc) ? options.cc.join(', ') : options.cc}\r\n`;
    }

    if (options.replyTo) {
      content += `Reply-To: ${options.replyTo}\r\n`;
    }

    // Add custom headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        content += `${key}: ${value}\r\n`;
      }
    }

    // Add metadata as headers
    if (options.metadata) {
      content += `X-Metadata-JSON: ${JSON.stringify(options.metadata)}\r\n`;
    }

    // Content-Type
    content += `Content-Type: ${options.html ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    content += `MIME-Version: 1.0\r\n`;
    content += `\r\n`;

    // Body
    if (options.html) {
      content += options.html;
    } else if (options.text) {
      content += options.text;
    }

    return content;
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: any): boolean {
    const message = error.message || '';

    // Retryable failures
    const retryablePatterns = [
      'ECONNREFUSED',
      'timeout',
      'ENOTFOUND',
      'ENETUNREACH',
      'temporarily unavailable',
    ];

    return retryablePatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }
}
