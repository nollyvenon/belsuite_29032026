/**
 * Email system types and interfaces
 */

export enum EmailProvider {
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SES = 'ses',
  POSTMARK = 'postmark',
}

export enum EmailStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  SPAM = 'spam',
  OPENED = 'opened',
}

export enum EmailCategory {
  AUTH = 'auth',
  PAYMENT = 'payment',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

// Email send request
export interface SendEmailRequest {
  to: {
    email: string;
    name?: string;
  };
  from?: {
    email: string;
    name?: string;
  };
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  variables?: Record<string, string>;
  replyTo?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  unsubscribeUrl?: string;
  unsubscribeGroupId?: string;
}

export interface SendEmailResponse {
  id: string;
  externalEmailId: string;
  status: EmailStatus;
  provider: EmailProvider;
  sentAt: Date;
}

// Bulk send
export interface BulkSendEmailRequest {
  personalization: Array<{
    to: Array<{ email: string; name?: string }>;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    subject?: string;
    variables?: Record<string, string>;
  }>;
  from: { email: string; name?: string };
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  replyTo?: string;
  tags?: string[];
}

// Event types
export interface EmailEventPayload {
  provider: EmailProvider;
  externalEmailId: string;
  eventType: 'sent' | 'delivered' | 'open' | 'click' | 'bounce' | 'spam' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Template types
export interface EmailTemplateRequest {
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables?: string[];
  category?: EmailCategory;
}

export interface EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
  category: EmailCategory;
  isActive: boolean;
  isSystem: boolean;
  usageCount: number;
  createdAt: Date;
}

// Webhook verification
export interface WebhookVerificationRequest {
  provider: EmailProvider;
  signature: string;
  payload: string;
}

export interface WebhookVerificationResponse {
  isValid: boolean;
  provider: EmailProvider;
}
