/**
 * Email Module
 * Configures and wires all email-related services, providers, and controllers
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { SendGridProvider } from './providers/sendgrid.provider';
import { MailgunProvider } from './providers/mailgun.provider';
import { SESProvider } from './providers/ses.provider';
import { PostmarkProvider } from './providers/postmark.provider';
import { SendmailProvider } from './providers/sendmail.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailProviderFactory } from './providers/email.provider.factory';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        name: 'email',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    EmailService,
    SendGridProvider,
    MailgunProvider,
    SESProvider,
    PostmarkProvider,
    SendmailProvider,
    SmtpProvider,
    EmailProviderFactory,
  ],
  controllers: [EmailController],
  exports: [EmailService, EmailProviderFactory],
})
export class EmailModule {}
