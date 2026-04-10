import { IsIn, IsOptional, IsString } from 'class-validator';

export const CAMPAIGN_OBJECTIVES = ['awareness', 'engagement', 'conversion', 'retention'] as const;
export const CAMPAIGN_CHANNELS = ['email', 'sms', 'whatsapp', 'voice', 'ai_voice_agent'] as const;
export const CAMPAIGN_PROVIDERS = ['sendgrid', 'mailgun', 'postmark', 'ses', 'smtp', 'sendmail', 'TWILIO', 'VONAGE', 'AWS_SNS', 'whatsapp', 'twilio_voice'] as const;

export interface CampaignChannelRoute {
  objective: string;
  channel: string;
  provider: string;
}

export class UpsertCampaignChannelRouteDto {
  @IsString()
  @IsIn(CAMPAIGN_OBJECTIVES)
  objective!: string;

  @IsString()
  @IsIn(CAMPAIGN_CHANNELS)
  channel!: string;

  @IsString()
  @IsIn(CAMPAIGN_PROVIDERS)
  provider!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
