/**
 * Email Provider Factory
 * Selects and returns appropriate email provider based on configuration
 */

import { Injectable } from '@nestjs/common';
import { SendGridProvider } from './sendgrid.provider';
import { MailgunProvider } from './mailgun.provider';
import { SESProvider } from './ses.provider';
import { PostmarkProvider } from './postmark.provider';
import { SendmailProvider } from './sendmail.provider';
import { SmtpProvider } from './smtp.provider';

export type EmailProviderType = 'sendgrid' | 'mailgun' | 'ses' | 'postmark' | 'sendmail' | 'smtp';
export type EmailProviderInstance =
  | SendGridProvider
  | MailgunProvider
  | SESProvider
  | PostmarkProvider
  | SendmailProvider
  | SmtpProvider;

@Injectable()
export class EmailProviderFactory {
  constructor(
    private readonly sendGrid: SendGridProvider,
    private readonly mailgun: MailgunProvider,
    private readonly ses: SESProvider,
    private readonly postmark: PostmarkProvider,
    private readonly sendmail: SendmailProvider,
    private readonly smtp: SmtpProvider,
  ) {}

  /**
   * Get provider instance by name
   */
  getProvider(providerName?: EmailProviderType): EmailProviderInstance {
    const provider = providerName || (process.env.EMAIL_PROVIDER as EmailProviderType) || 'sendgrid';

    switch (provider) {
      case 'mailgun':
        return this.mailgun;
      case 'ses':
        return this.ses;
      case 'postmark':
        return this.postmark;
      case 'sendmail':
        return this.sendmail;
      case 'smtp':
        return this.smtp;
      case 'sendgrid':
      default:
        return this.sendGrid;
    }
  }

  /**
   * Get all available providers
   */
  getAllProviders(): Record<EmailProviderType, EmailProviderInstance> {
    return {
      sendgrid: this.sendGrid,
      mailgun: this.mailgun,
      ses: this.ses,
      postmark: this.postmark,
      sendmail: this.sendmail,
      smtp: this.smtp,
    };
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): EmailProviderType[] {
    const configured: EmailProviderType[] = [];

    if (process.env.SENDGRID_API_KEY) configured.push('sendgrid');
    if (process.env.MAILGUN_API_KEY) configured.push('mailgun');
    if (process.env.AWS_ACCESS_KEY_ID) configured.push('ses');
    if (process.env.POSTMARK_API_KEY) configured.push('postmark');
    if (process.env.SENDMAIL_PATH) configured.push('sendmail');
    if (process.env.SMTP_HOST) configured.push('smtp');

    return configured;
  }
}
