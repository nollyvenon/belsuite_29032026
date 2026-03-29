/**
 * Email Provider Interface
 * Contract for email service implementations
 */

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

export interface IEmailProvider {
  /**
   * Get provider type
   */
  getProvider(): EmailProvider;

  /**
   * Send single email
   */
  sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;

  /**
   * Send bulk emails
   */
  sendBulkEmails(request: BulkSendEmailRequest): Promise<SendEmailResponse[]>;

  /**
   * Get email status
   */
  getEmailStatus(externalEmailId: string): Promise<EmailStatus>;

  /**
   * Create email template in provider
   */
  createTemplate(request: EmailTemplateRequest): Promise<EmailTemplate>;

  /**
   * Delete email template
   */
  deleteTemplate(templateId: string): Promise<void>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse>;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): Promise<EmailEventPayload>;

  /**
   * Get webhook secret
   */
  getWebhookSecret(): string;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}
