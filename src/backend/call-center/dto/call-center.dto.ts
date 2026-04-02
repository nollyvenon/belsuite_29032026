import {
  IsEnum, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { InboundCallStatus } from '@prisma/client';

export class LogInboundCallDto {
  @IsString() fromNumber: string;
  @IsString() toNumber: string;
  @IsOptional() @IsString() callerName?: string;
  @IsOptional() @IsEnum(InboundCallStatus) status?: InboundCallStatus;
  @IsOptional() @IsString() agentId?: string;
  @IsOptional() @IsString() queueName?: string;
  @IsOptional() @IsString() externalCallId?: string;
}

export class UpdateCallDto {
  @IsOptional() @IsEnum(InboundCallStatus) status?: InboundCallStatus;
  @IsOptional() @IsNumber() @Min(0) durationSeconds?: number;
  @IsOptional() @IsString() agentId?: string;
  @IsOptional() @IsString() recordingUrl?: string;
  @IsOptional() @IsString() transcription?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CallQueryDto {
  @IsOptional() @IsEnum(InboundCallStatus) status?: InboundCallStatus;
  @IsOptional() @IsString() agentId?: string;
  @IsOptional() @IsNumber() @Min(1) page?: number;
  @IsOptional() @IsNumber() @Min(1) limit?: number;
}
