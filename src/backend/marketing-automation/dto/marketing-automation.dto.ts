import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const AUTOMATION_CHANNELS = [
  'email',
  'sms',
  'whatsapp',
  'voice',
  'ai_voice_agent',
] as const;

export const CAMPAIGN_TRIGGER_MODES = ['manual', 'event', 'schedule'] as const;

export class CampaignStepVariantDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  message: string;
}

export class StepConditionDto {
  @IsString()
  field: string;

  @IsIn(['equals', 'contains', 'exists', 'gt', 'lt'])
  operator: 'equals' | 'contains' | 'exists' | 'gt' | 'lt';

  @IsOptional()
  value?: string | number | boolean;
}

export class CampaignStepDto {
  @IsIn(AUTOMATION_CHANNELS)
  channel: (typeof AUTOMATION_CHANNELS)[number];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delayHours?: number;

  @IsOptional()
  @IsBoolean()
  optimizeSendTime?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignStepVariantDto)
  variants?: CampaignStepVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepConditionDto)
  conditions?: StepConditionDto[];
}

export class CampaignTriggerDto {
  @IsIn(CAMPAIGN_TRIGGER_MODES)
  mode: 'manual' | 'event' | 'schedule';

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  scheduleAt?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}

export class CampaignBuilderNodeDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class CampaignBuilderEdgeDto {
  @IsString()
  id: string;

  @IsString()
  source: string;

  @IsString()
  target: string;
}

export class CampaignContactDto {
  @IsOptional()
  @IsString()
  id?: string;

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
  timezone?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class CreateMarketingAutomationCampaignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  objective: string;

  @ValidateNested()
  @Type(() => CampaignTriggerDto)
  trigger: CampaignTriggerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignStepDto)
  steps?: CampaignStepDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalizationFields?: string[];

  @IsOptional()
  @IsObject()
  audience?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  abTestSettings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  optimizeSendTime?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignBuilderNodeDto)
  builderNodes?: CampaignBuilderNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignBuilderEdgeDto)
  builderEdges?: CampaignBuilderEdgeDto[];
}

export class UpdateMarketingAutomationCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignTriggerDto)
  trigger?: CampaignTriggerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignStepDto)
  steps?: CampaignStepDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalizationFields?: string[];

  @IsOptional()
  @IsObject()
  audience?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  abTestSettings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  optimizeSendTime?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignBuilderNodeDto)
  builderNodes?: CampaignBuilderNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignBuilderEdgeDto)
  builderEdges?: CampaignBuilderEdgeDto[];
}

export class MarketingAutomationListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsIn(CAMPAIGN_TRIGGER_MODES)
  triggerMode?: 'manual' | 'event' | 'schedule';

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

export class LaunchCampaignDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignContactDto)
  contacts: CampaignContactDto[];

  @IsOptional()
  @IsBoolean()
  respectOptimalSendTime?: boolean;
}

export class TriggerWorkflowEventDto {
  @IsString()
  eventName: string;

  @ValidateNested()
  @Type(() => CampaignContactDto)
  contact: CampaignContactDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class GenerateMarketingCopyDto {
  @IsString()
  objective: string;

  @IsString()
  offer: string;

  @IsString()
  audience: string;

  @IsOptional()
  @IsIn(AUTOMATION_CHANNELS)
  channel?: (typeof AUTOMATION_CHANNELS)[number];

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  variantCount?: number;
}

export class OptimizeSendTimeDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(180)
  lookbackDays?: number;

  @IsOptional()
  @IsIn(AUTOMATION_CHANNELS)
  channel?: (typeof AUTOMATION_CHANNELS)[number];
}

export class AbTestVariantDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  message: string;
}

export class AutoOptimizeAbTestDto {
  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  metric?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbTestVariantDto)
  variants: AbTestVariantDto[];
}

export class TwilioStatusCallbackDto {
  @IsOptional()
  @IsString()
  MessageSid?: string;

  @IsOptional()
  @IsString()
  SmsSid?: string;

  @IsOptional()
  @IsString()
  CallSid?: string;

  @IsOptional()
  @IsString()
  MessageStatus?: string;

  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @IsOptional()
  @IsString()
  CallStatus?: string;

  @IsOptional()
  @IsString()
  To?: string;

  @IsOptional()
  @IsString()
  From?: string;

  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @IsOptional()
  @IsString()
  ErrorMessage?: string;

  @IsOptional()
  @IsString()
  AccountSid?: string;

  @IsOptional()
  @IsString()
  ApiVersion?: string;
}
