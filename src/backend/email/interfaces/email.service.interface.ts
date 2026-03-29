/**
 * Email Service - Core abstraction and interfaces
 * Defines the email service contract for all implementations
 */

export interface EmailSendOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  attachments?: EmailAttachment[];
  tags?: string[];
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string; // Content ID for embedded images
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
  retryable?: boolean;
}

export interface EmailStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IEmailService {
  /**
   * Send a single email
   */
  send(options: EmailSendOptions): Promise<EmailResponse>;

  /**
   * Send multiple emails (batch)
   */
  sendBatch(emails: EmailSendOptions[]): Promise<EmailResponse[]>;

  /**
   * Get email status
   */
  getStatus(messageId: string): Promise<EmailStatus | null>;

  /**
   * Get service health
   */
  health(): Promise<{ healthy: boolean; provider: string; timestamp: Date }>;

  /**
   * Verify email domain
   */
  verifyDomain?(domain: string): Promise<boolean>;
}

/**
 * Email template abstraction
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
  category: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables?: string[];
  category: string;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  variables?: string[];
  category?: string;
  isActive?: boolean;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  rateLimit?: {
    perSecond?: number;
    perDay?: number;
  };
}

/**
 * Webhook event types
 */
export type EmailWebhookEvent =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'unsubscribed'
  | 'complained'
  | 'charge_back'
  | 'processed'
  | 'dropped'
  | 'deferred';

export interface EmailWebhookPayload {
  event: EmailWebhookEvent;
  messageId: string;
  email?: string;
  provider: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
