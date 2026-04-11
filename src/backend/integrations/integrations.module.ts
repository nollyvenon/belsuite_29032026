import { Module }       from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';

// OAuth + Webhooks
import { OAuthService }            from './oauth/oauth.service';
import { WebhookListenerService }  from './webhooks/webhook-listener.service';

// Google
import { GoogleAuthService }      from './providers/google/google-auth.service';
import { GmailService }           from './providers/google/gmail.service';
import { GoogleCalendarService }  from './providers/google/google-calendar.service';
import { GoogleDriveService }     from './providers/google/google-drive.service';
import { GoogleSheetsService }    from './providers/google/google-sheets.service';

// Social
import { FacebookService }  from './providers/social/facebook.service';
import { TwitterService }   from './providers/social/twitter.service';
import { LinkedInService }  from './providers/social/linkedin.service';
import { TikTokService }    from './providers/social/tiktok.service';

// Communication
import { WhatsAppService }  from './providers/communication/whatsapp.service';
import { TelegramService }  from './providers/communication/telegram.service';
import { SmsService }       from './providers/communication/sms.service';
import { SlackService }     from './providers/communication/slack.service';
import { ZapierService }    from './providers/communication/zapier.service';
import { IntegrationEventsService } from './services/integration-events.service';
import { IntegrationDeliveryProcessor } from './processors/integration-delivery.processor';

// Controllers
import {
  IntegrationsOAuthController,
  IntegrationsWebhookController,
  IntegrationsController,
} from './integrations.controller';

const PROVIDERS = [
  // Core
  OAuthService,
  WebhookListenerService,
  // Google
  GoogleAuthService,
  GmailService,
  GoogleCalendarService,
  GoogleDriveService,
  GoogleSheetsService,
  // Social
  FacebookService,
  TwitterService,
  LinkedInService,
  TikTokService,
  // Communication
  WhatsAppService,
  TelegramService,
  SmsService,
  SlackService,
  ZapierService,
  IntegrationEventsService,
  IntegrationDeliveryProcessor,
];

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'integration-delivery',
    }),
  ],
  controllers: [
    IntegrationsOAuthController,
    IntegrationsWebhookController,
    IntegrationsController,
  ],
  providers: PROVIDERS,
  exports:   PROVIDERS,
})
export class IntegrationsModule {}
