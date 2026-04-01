import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const CRM_STAGES = [
  'new',
  'qualified',
  'contacted',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;

export const OUTREACH_CHANNELS = ['email', 'sms', 'whatsapp', 'linkedin', 'call'] as const;

export class ImportLeadToCrmDto {
  @IsOptional()
  @IsString()
  leadEventId?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(CRM_STAGES)
  initialStage?: (typeof CRM_STAGES)[number];
}

export class PipelineQueryDto {
  @IsOptional()
  @IsIn(CRM_STAGES)
  stage?: (typeof CRM_STAGES)[number];

  @IsOptional()
  @IsString()
  q?: string;

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

export class StageTransitionDto {
  @IsString()
  crmLeadId: string;

  @IsIn(CRM_STAGES)
  toStage: (typeof CRM_STAGES)[number];

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OutreachStepDto {
  @IsIn(OUTREACH_CHANNELS)
  channel: (typeof OUTREACH_CHANNELS)[number];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delayHours?: number;
}

export class StartOutreachSequenceDto {
  @IsString()
  crmLeadId: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsBoolean()
  autoDispatch?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  steps?: OutreachStepDto[];
}

export class DispatchOutreachMessageDto {
  @IsString()
  crmLeadId: string;

  @IsIn(OUTREACH_CHANNELS)
  channel: (typeof OUTREACH_CHANNELS)[number];

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  message: string;
}

export class GenerateSequencePlanDto {
  @IsString()
  crmLeadId: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxTouches?: number;
}

export class MarkConversionDto {
  @IsString()
  crmLeadId: string;

  @IsIn(['won', 'lost'])
  status: 'won' | 'lost';

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
