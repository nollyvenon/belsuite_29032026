import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InboundInputDto {
  @IsString()
  @MaxLength(64)
  channel!: string; // telegram | whatsapp | webchat | sms | email

  @IsString()
  @MaxLength(255)
  externalUserId!: string;

  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class WorkflowQueryDto {
  @IsOptional()
  @IsString()
  correlationId?: string;
}
