import { IsArray, IsBoolean, IsIn, IsOptional, IsString, Max, Min } from 'class-validator';

export const INTEGRATION_WEBHOOK_PROVIDERS = ['SLACK', 'ZAPIER', 'EMAIL_SENDGRID', 'EMAIL_MAILGUN', 'EMAIL_POSTMARK', 'EMAIL_SES', 'EMAIL_SMTP', 'SMS_TWILIO', 'SMS_AFRICAS_TALKING'] as const;

export class IntegrationRetryPolicyDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @IsOptional()
  @Min(1000)
  @Max(60_000)
  retryDelayMs?: number;

  @IsOptional()
  @IsArray()
  retryableStatuses?: string[];
}

export class IntegrationWebhookConfigDto {
  @IsString()
  @IsIn(INTEGRATION_WEBHOOK_PROVIDERS)
  provider!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class IntegrationDeliveryQueryDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
