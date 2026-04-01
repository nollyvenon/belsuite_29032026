import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VOICE_AGENT_STYLES = ['consultative', 'urgent', 'friendly', 'enterprise'] as const;

export class CreateVoiceAgentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectionPlaybook?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualificationQuestions?: string[];

  @IsOptional()
  @IsIn(VOICE_AGENT_STYLES)
  style?: (typeof VOICE_AGENT_STYLES)[number];

  @IsOptional()
  @IsObject()
  memoryConfig?: Record<string, unknown>;
}

export class VoiceLeadDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class StartAICallDto {
  @IsString()
  voiceAgentId: string;

  @ValidateNested()
  @Type(() => VoiceLeadDto)
  lead: VoiceLeadDto;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  objective?: string;
}

export class ConversationTurnDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsString()
  intentHint?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class BookAppointmentDto {
  @IsString()
  callId: string;

  @IsString()
  appointmentAt: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TwilioVoiceWebhookDto {
  @IsOptional()
  @IsString()
  CallSid?: string;

  @IsOptional()
  @IsString()
  CallStatus?: string;

  @IsOptional()
  @IsString()
  From?: string;

  @IsOptional()
  @IsString()
  To?: string;

  @IsOptional()
  @IsString()
  SpeechResult?: string;

  @IsOptional()
  @IsString()
  Confidence?: string;

  @IsOptional()
  @IsString()
  RecordingSid?: string;

  @IsOptional()
  @IsString()
  RecordingUrl?: string;

  @IsOptional()
  @IsString()
  RecordingStatus?: string;

  @IsOptional()
  @IsString()
  RecordingDuration?: string;
}

export class AICallingListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['queued', 'in_progress', 'completed', 'failed', 'booked'])
  status?: 'queued' | 'in_progress' | 'completed' | 'failed' | 'booked';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}
