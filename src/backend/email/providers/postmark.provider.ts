/**
 * Postmark Email Provider
 * Implements IEmailService for Postmark integration
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
import { v4 as uuid } from 'uuid';

@Injectable()
export class PostmarkProvider implements IEmailService {
  private readonly logger = new Logger(PostmarkProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiKey = process.env.POSTMARK_API_KEY || '';

    this.client = axios.create({
      baseURL: 'https://api.postmarkapp.com',
      headers: {
        'X-Postmark-Server-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send single email
   */
  async send(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Postmark API key not configured');
      }

      const payload: any = {
        From: `${process.env.EMAIL_FROM_NAME || 'Belsuite'} <${process.env.EMAIL_FROM || 'noreply@belsuite.com'}>`,
        To: Array.isArray(options.to) ? options.to.join(',') : options.to,
        Subject: options.subject,
        ReplyTo: options.replyTo,
      };

      // HTML and text content
      if (options.html) {
        payload.HtmlBody = options.html;
      }

      if (options.text) {
        payload.TextBody = options.text;
      }

      // CC and BCC
      if (options.cc) {
        payload.Cc = Array.isArray(options.cc) ? options.cc.join(',') : options.cc;
      }

      if (options.bcc) {
        payload.Bcc = Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc;
      }

      // Custom metadata
      if (options.metadata) {
        payload.Metadata = options.metadata;
      }

      // Tags
      if (options.tags && options.tags.length > 0) {
        payload.Tag = options.tags.join(', ');
      }

      // Priority (Postmark uses TrackOpens and TrackLinks)
      payload.TrackOpens = true;
      payload.TrackLinks = 'HtmlAndText';

      // Attachments
      if (options.attachments && options.attachments.length > 0) {
        payload.Attachments = options.attachments.map((att) => ({
          Name: att.filename,
          Content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : Buffer.from(att.content).toString('base64'),
          ContentType: att.contentType || 'application/octet-stream',
          ContentId: att.cid,
        }));
      }

      const response = await this.client.post('/email', payload);
      const messageId = response.data.MessageID;

      this.logger.log(`Email sent via Postmark: ${messageId}`);

      return {
        success: true,
        messageId,
        provider: 'postmark',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: 'postmark',
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
      if (!this.apiKey) {
        throw new Error('Postmark API key not configured');
      }

      // Postmark batch API
      const messages = emails.map((email) => ({
        From: `${process.env.EMAIL_FROM_NAME || 'Belsuite'} <${process.env.EMAIL_FROM || 'noreply@belsuite.com'}>`,
        To: Array.isArray(email.to) ? email.to.join(',') : email.to,
        Subject: email.subject,
        HtmlBody: email.html,
        TextBody: email.text,
        Cc: email.cc
          ? Array.isArray(email.cc)
            ? email.cc.join(',')
            : email.cc
          : undefined,
        Bcc: email.bcc
          ? Array.isArray(email.bcc)
            ? email.bcc.join(',')
            : email.bcc
          : undefined,
        ReplyTo: email.replyTo,
        Metadata: email.metadata,
        Tag: email.tags?.join(', '),
        TrackOpens: true,
        TrackLinks: 'HtmlAndText',
      }));

      const response = await this.client.post('/email/batch', {
        Messages: messages,
      });

      return response.data.map((result: any) => ({
        success: result.ErrorCode === 0,
        messageId: result.MessageID,
        error: result.Message,
        provider: 'postmark',
        timestamp: new Date(),
      }));
    } catch (error) {
      this.logger.error(`Batch send failed: ${error.message}`);

      return emails.map(() => ({
        success: false,
        error: error.message,
        provider: 'postmark',
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
          provider: 'POSTMARK',
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
          provider: 'postmark',
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
      if (!this.apiKey) {
        return {
          healthy: false,
          provider: 'postmark',
          timestamp: new Date(),
        };
      }

      // Make a simple API call to verify credentials
      await this.client.get('/deliverystats');

      return {
        healthy: true,
        provider: 'postmark',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        healthy: false,
        provider: 'postmark',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify domain
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/senders?domain=${domain}`);
      return response.data.Senders && response.data.Senders.length > 0;
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
      return status >= 500 || status === 429;
    }

    // Postmark specific error codes
    const retryableErrors = ['InvalidSenderSignature', 'InactiveRecipient'];
    if (error.response?.data?.Name && retryableErrors.includes(error.response.data.Name)) {
      return true;
    }

    return true;
  }
}
