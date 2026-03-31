/**
 * SMTP Email Provider
 * Implements IEmailService using NodeMailer for generic SMTP connections
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  EmailSendOptions,
  EmailResponse,
  EmailStatus,
  IEmailService,
} from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SmtpProvider implements IEmailService {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      const host = process.env.SMTP_HOST || 'localhost';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;

      const config: any = {
        host,
        port,
        secure,
        logger: false,
        debug: process.env.NODE_ENV === 'development',
      };

      // Add authentication if credentials are provided
      if (user && pass) {
        config.auth = {
          user,
          pass,
        };
      }

      this.transporter = nodemailer.createTransport(config);

      this.logger.log(`SMTP Provider initialized: ${host}:${port}`);
    } catch (error) {
      this.logger.error(`Failed to initialize SMTP transporter: ${error.message}`);
      this.transporter = null;
    }
  }

  /**
   * Send single email
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const messageId = `smtp_${uuid()}`;
      const fromEmail = process.env.EMAIL_FROM || 'noreply@belsuite.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Belsuite';

      // Prepare recipients
      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      // Prepare attachments if any
      const attachments = options.attachments
        ? options.attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
            cid: att.cid,
          }))
        : undefined;

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipients,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments,
        headers: {
          'X-Message-ID': messageId,
          'X-Priority': options.priority === 'high' ? '1' : options.priority === 'low' ? '5' : '3',
          ...(options.headers || {}),
        },
      });

      this.logger.log(`Email sent via SMTP: ${messageId}, response: ${info.response}`);

      const organizationId =
        typeof options.metadata?.organizationId === 'string'
          ? options.metadata.organizationId
          : null;

      if (organizationId) {
        await this.prisma.email.create({
          data: {
            organizationId,
            externalEmailId: info.messageId || messageId,
            provider: 'SMTP',
            toEmail: recipients,
            subject: options.subject,
            sentAt: new Date(),
          },
        });
      }

      return {
        success: true,
        messageId: info.messageId || messageId,
        provider: 'smtp',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: 'smtp',
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

      // Process emails sequentially to avoid connection issues
      for (const email of emails) {
        const result = await this.send(email);
        results.push(result);

        // Add small delay between emails to prevent connection saturation
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return results;
    } catch (error) {
      this.logger.error(`Batch send failed: ${error.message}`);

      return emails.map(() => ({
        success: false,
        error: error.message,
        provider: 'smtp',
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
          provider: 'SMTP',
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
          provider: 'smtp',
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
      if (!this.transporter) {
        return {
          healthy: false,
          provider: 'smtp',
          timestamp: new Date(),
        };
      }

      // Verify connection
      await this.transporter.verify();

      return {
        healthy: true,
        provider: 'smtp',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);

      // Attempt to reinitialize on failure
      this.initializeTransporter();

      return {
        healthy: false,
        provider: 'smtp',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify domain
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      // SMTP doesn't have built-in domain verification
      // We can verify by checking if we have proper SMTP credentials configured
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;

      if (!host || !user) {
        return false;
      }

      // Check if transporter is healthy
      const healthCheck = await this.health();
      return healthCheck.healthy;
    } catch (error) {
      this.logger.error(`Domain verification failed: ${error.message}`);
      return false;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: any): boolean {
    const message = error.message || '';
    const code = error.code || '';

    // Transient failures
    const retryablePatterns = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'timeout',
      'temporarily unavailable',
      'service not available',
      '421',
      '450',
      '451',
      '452',
    ];

    return retryablePatterns.some(
      (pattern) =>
        message.toLowerCase().includes(pattern.toLowerCase()) ||
        code.includes(pattern),
    );
  }
}
