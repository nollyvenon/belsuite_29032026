/**
 * Admin Email Settings DTOs
 */

import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEmail } from 'class-validator';

export class AdminEmailSettingsDto {
  organizationId!: string;
  primaryProvider!: string;
  
  // SendGrid
  sendgridApiKey?: string;
  sendgridWebhookSecret?: string;
  sendgridDomain?: string;
  
  // Mailgun
  mailgunApiKey?: string;
  mailgunDomain?: string;
  
  // AWS SES
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  
  // Postmark
  postmarkApiKey?: string;
  postmarkDomain?: string;
  
  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  
  // Sendmail
  sendmailPath?: string;
  
  // General
  emailFrom!: string;
  emailFromName!: string;
  replyTo?: string;
  
  // Failover
  enableFailover!: boolean;
  fallbackProviders!: string[];
  maxRetries!: number;
  retryDelayMs!: number;
  
  // Rate Limiting
  rateLimitPerMinute!: number;
  rateLimitPerHour!: number;
  
  // Features
  trackingEnabled!: boolean;
  webhooksEnabled!: boolean;
  attachmentsEnabled!: boolean;
  
  // Audit
  createdAt!: Date;
  updatedAt!: Date;
  updatedBy?: string;
  lastTestedAt?: Date;
  testStatus?: string;
}

export class UpdateEmailSettingsDto {
  @IsOptional()
  @IsString()
  primaryProvider?: string;
  
  @IsOptional()
  @IsString()
  sendgridApiKey?: string;
  
  @IsOptional()
  @IsString()
  sendgridWebhookSecret?: string;
  
  @IsOptional()
  @IsString()
  sendgridDomain?: string;
  
  @IsOptional()
  @IsString()
  mailgunApiKey?: string;
  
  @IsOptional()
  @IsString()
  mailgunDomain?: string;
  
  @IsOptional()
  @IsString()
  awsAccessKeyId?: string;
  
  @IsOptional()
  @IsString()
  awsSecretAccessKey?: string;
  
  @IsOptional()
  @IsString()
  awsRegion?: string;
  
  @IsOptional()
  @IsString()
  postmarkApiKey?: string;
  
  @IsOptional()
  @IsString()
  postmarkDomain?: string;
  
  @IsOptional()
  @IsString()
  smtpHost?: string;
  
  @IsOptional()
  @IsNumber()
  smtpPort?: number;
  
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;
  
  @IsOptional()
  @IsString()
  smtpUser?: string;
  
  @IsOptional()
  @IsString()
  smtpPassword?: string;
  
  @IsOptional()
  @IsString()
  sendmailPath?: string;
  
  @IsOptional()
  @IsString()
  emailFrom?: string;
  
  @IsOptional()
  @IsString()
  emailFromName?: string;
  
  @IsOptional()
  @IsString()
  replyTo?: string;
  
  @IsOptional()
  @IsBoolean()
  enableFailover?: boolean;
  
  @IsOptional()
  @IsArray()
  fallbackProviders?: string[];
  
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
  
  @IsOptional()
  @IsNumber()
  retryDelayMs?: number;
  
  @IsOptional()
  @IsNumber()
  rateLimitPerMinute?: number;
  
  @IsOptional()
  @IsNumber()
  rateLimitPerHour?: number;
  
  @IsOptional()
  @IsBoolean()
  trackingEnabled?: boolean;
  
  @IsOptional()
  @IsBoolean()
  webhooksEnabled?: boolean;
  
  @IsOptional()
  @IsBoolean()
  attachmentsEnabled?: boolean;
}

export class TestEmailDto {
  @IsEmail()
  testEmail!: string;
}

export class EmailProviderConfigDto {
  id!: string;
  name!: string;
  description!: string;
  configFields!: ConfigField[];
  pricing!: string;
  maxEmailsPerSecond!: number;
  features!: string[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'email';
  required: boolean;
  description: string;
}
