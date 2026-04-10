import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminSmsSettingsDto {
  provider!: 'TWILIO' | 'VONAGE' | 'AWS_SNS';
  fromNumber?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  vonageFromNumber?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  enabled!: boolean;
  updatedAt!: string;
  lastTestedAt?: string;
  testStatus?: string;
}

export class UpdateSmsSettingsDto {
  @IsOptional()
  @IsString()
  provider?: 'TWILIO' | 'VONAGE' | 'AWS_SNS';

  @IsOptional()
  @IsString()
  fromNumber?: string;

  @IsOptional()
  @IsString()
  twilioAccountSid?: string;

  @IsOptional()
  @IsString()
  twilioAuthToken?: string;

  @IsOptional()
  @IsString()
  twilioFromNumber?: string;

  @IsOptional()
  @IsString()
  vonageApiKey?: string;

  @IsOptional()
  @IsString()
  vonageApiSecret?: string;

  @IsOptional()
  @IsString()
  vonageFromNumber?: string;

  @IsOptional()
  @IsString()
  awsRegion?: string;

  @IsOptional()
  @IsString()
  awsAccessKeyId?: string;

  @IsOptional()
  @IsString()
  awsSecretAccessKey?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  lastTestedAt?: string;

  @IsOptional()
  @IsString()
  testStatus?: string;
}

export class TestSmsDto {
  @IsString()
  to!: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class SmsProviderConfigDto {
  id!: 'TWILIO' | 'VONAGE' | 'AWS_SNS';
  name!: string;
  requiredFields!: string[];
}
