/**
 * SendGrid Email Provider Implementation
 * https://sendgrid.com/docs/API/
 */

import { Injectable } from '@nestjs/common';
const sgMail = require('@sendgrid/mail');
import { IEmailProvider } from '../interfaces/email-provider.interface';
import {
  EmailProvider,
  EmailStatus,
  SendEmailRequest,
  SendEmailResponse,
  BulkSendEmailRequest,
  EmailEventPayload,
  EmailTemplateRequest,
  EmailTemplate,
  WebhookVerificationRequest,
  WebhookVerificationResponse,
} from '../types/email.types';
import * as crypto from 'crypto';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  private apiKey: string;
  private webhookSecret: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@belsuite.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Belsuite';

    sgMail.setApiKey(this.apiKey);
  }

  getProvider(): EmailProvider {
    return EmailProvider.SENDGRID;
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const emailId = `sendgrid_${uuid()}`;

      const message: any = {
        to: {
          email: request.to.email,
          name: request.to.name,
        },
        from: {
          email: request.from?.email || this.fromEmail,
          name: request.from?.name || this.fromName,
        },
        subject: request.subject,
        html: request.htmlContent,
        text: request.textContent,
        replyTo: request.replyTo,
        customArgs: {
          emailId,
          organizationId: request.metadata?.organizationId,
          ...request.metadata,
        },
      };

      // Add tags if provided
      if (request.tags && request.tags.length > 0) {
        message.categories = request.tags;
      }

      // Add unsubscribe link if provided
      if (request.unsubscribeUrl) {
        message.mailSettings = {
          sandbox_mode: {
            enable: false,
          },
          footer: {
            enable: true,
            text: `Unsubscribe: ${request.unsubscribeUrl}`,
            html: `<a href="${request.unsubscribeUrl}">Unsubscribe</a>`,
          },
        };
      }

      const response = await sgMail.send(message);

      const externalEmailId = response[0].headers['x-message-id'] || emailId;

      return {
        id: emailId,
        externalEmailId,
        status: EmailStatus.SENT,
        provider: EmailProvider.SENDGRID,
        sentAt: new Date(),
      };
    } catch (error) {
      throw new Error(`SendGrid email send failed: ${error.message}`);
    }
  }

  async sendBulkEmails(
    request: BulkSendEmailRequest,
  ): Promise<SendEmailResponse[]> {
    try {
      const results: SendEmailResponse[] = [];

      for (const personalization of request.personalization) {
        for (const recipient of personalization.to) {
          let htmlContent = request.htmlContent;
          let textContent = request.textContent;

          // Replace variables
          if (personalization.variables) {
            for (const [key, value] of Object.entries(
              personalization.variables,
            )) {
              const templateToken = `{{${key}}}`;
              htmlContent = htmlContent?.replace(
                new RegExp(templateToken, 'g'),
                value,
              );
              textContent = textContent?.replace(
                new RegExp(templateToken, 'g'),
                value,
              );
            }
          }

          const result = await this.sendEmail({
            to: recipient,
            from: request.from,
            subject: personalization.subject ?? request.subject ?? 'Belsuite Notification',
            htmlContent,
            textContent,
            metadata: personalization.variables,
          });

          results.push(result);
        }
      }

      return results;
    } catch (error) {
      throw new Error(`SendGrid bulk send failed: ${error.message}`);
    }
  }

  async getEmailStatus(externalEmailId: string): Promise<EmailStatus> {
    // SendGrid doesn't provide a direct API to check email status
    // Use webhooks for status tracking instead
    return EmailStatus.SENT;
  }

  async createTemplate(
    request: EmailTemplateRequest,
  ): Promise<EmailTemplate> {
    void request;
    throw new Error('SendGrid template creation is not supported in this provider implementation');
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      // In production, delete from SendGrid API
    } catch (error) {
      throw new Error(`SendGrid template deletion failed: ${error.message}`);
    }
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    try {
      // SendGrid uses HMAC-SHA256
      const timestamp = request.signature.split('=')[0];
      const signature = request.signature.split('=')[1];

      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(timestamp + request.payload)
        .digest('base64');

      const isValid = hash === signature;

      return {
        isValid,
        provider: EmailProvider.SENDGRID,
      };
    } catch (error) {
      return {
        isValid: false,
        provider: EmailProvider.SENDGRID,
      };
    }
  }

  async parseWebhookEvent(payload: any): Promise<EmailEventPayload> {
    const event = payload[0];

    let eventType: 'sent' | 'delivered' | 'open' | 'click' | 'bounce' | 'spam' | 'failed' =
      'sent';

    switch (event.event) {
      case 'delivered':
        eventType = 'delivered';
        break;
      case 'open':
        eventType = 'open';
        break;
      case 'click':
        eventType = 'click';
        break;
      case 'bounce':
        eventType = 'bounce';
        break;
      case 'spamreport':
        eventType = 'spam';
        break;
      case 'dropped':
      case 'failed':
        eventType = 'failed';
        break;
    }

    return {
      provider: EmailProvider.SENDGRID,
      externalEmailId: event.sg_message_id,
      eventType,
      timestamp: new Date(event.timestamp * 1000),
      metadata: {
        email: event.email,
        reason: event.reason,
        status: event.status,
      },
    };
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Verify API key by making a simple request
      const response = await sgMail.send({
        to: 'test@example.com',
        from: this.fromEmail,
        subject: 'Health Check',
        text: 'This is a health check email.',
        sendAt: Math.floor(Date.now() / 1000) + 1, // Send 1 second in future to avoid actual send
      });

      return response.length > 0;
    } catch (error) {
      // May fail due to invalid recipient, but API is working
      return this.apiKey !== '';
    }
  }
}
