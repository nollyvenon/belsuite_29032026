/**
 * Mailgun Email Provider
 * Implements IEmailService for Mailgun integration
 */

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  EmailSendOptions,
  EmailResponse,
  EmailStatus,
  IEmailService,
} from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';
import FormData from 'form-data';

@Injectable()
export class MailgunProvider implements IEmailService {
  private readonly logger = new Logger(MailgunProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly baseUrl: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiKey = process.env.MAILGUN_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.baseUrl = `https://api.mailgun.net/v3/${this.domain}`;

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: 'api',
        password: this.apiKey,
      },
    });
  }

  /**
   * Send single email
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      if (!this.apiKey || !this.domain) {
        throw new Error('Mailgun credentials not configured');
      }

      const form = new FormData();
      form.append(
        'from',
        `${process.env.EMAIL_FROM_NAME || 'Belsuite'} <${process.env.EMAIL_FROM || 'noreply@belsuite.com'}>`,
      );

      // Handle recipients
      if (Array.isArray(options.to)) {
        options.to.forEach((to) => form.append('to', to));
      } else {
        form.append('to', options.to);
      }

      // CC and BCC
      if (options.cc) {
        const ccList = Array.isArray(options.cc) ? options.cc : [options.cc];
        ccList.forEach((cc) => form.append('cc', cc));
      }

      if (options.bcc) {
        const bccList = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
        bccList.forEach((bcc) => form.append('bcc', bcc));
      }

      form.append('subject', options.subject);

      if (options.html) {
        form.append('html', options.html);
      }

      if (options.text) {
        form.append('text', options.text);
      }

      // Add custom data and tags
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          form.append(`v:${key}`, String(value));
        });
      }

      if (options.tags) {
        form.append('o:tag', options.tags);
      }

      // Set priority
      if (options.priority === 'high') {
        form.append('o:time-optimized-delivery', 'no');
      }

      // Reply-To
      if (options.replyTo) {
        form.append('h:Reply-To', options.replyTo);
      }

      // Attachments
      if (options.attachments && options.attachments.length > 0) {
        for (const attachment of options.attachments) {
          const buffer = Buffer.isBuffer(attachment.content)
            ? attachment.content
            : Buffer.from(attachment.content);
          form.append('attachment', buffer, attachment.filename);
        }
      }

      const response = await this.client.post('/messages', form, {
        headers: form.getHeaders(),
      });

      const messageId = response.data.id;

      this.logger.log(`Email sent via Mailgun: ${messageId}`);

      return {
        success: true,
        messageId,
        provider: 'mailgun',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: 'mailgun',
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

      // Mailgun rate limiting - add small delay
      await new Promise((resolve) => setTimeout(resolve, 10));
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
          provider: 'MAILGUN',
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
          provider: 'mailgun',
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
      if (!this.apiKey || !this.domain) {
        return {
          healthy: false,
          provider: 'mailgun',
          timestamp: new Date(),
        };
      }

      // Make a simple API call to verify credentials
      await this.client.get('/domain');

      return {
        healthy: true,
        provider: 'mailgun',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        healthy: false,
        provider: 'mailgun',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify domain
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/${domain}`);
      return response.data.domain.name === domain;
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
    if (error.response?.status) {
      const status = error.response.status;
      // 5xx errors and 429 (rate limit) are retryable
      return status >= 500 || status === 429 || status === 408;
    }
    return true;
  }
}
