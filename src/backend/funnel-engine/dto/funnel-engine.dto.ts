import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const STEP_TYPES = ['landing', 'capture', 'upsell', 'downsell', 'thankyou', 'webinar', 'checkout'] as const;
export const FIELD_TYPES = ['text', 'email', 'phone', 'select', 'checkbox', 'textarea', 'hidden'] as const;
export const FUNNEL_GOALS = ['lead_capture', 'sales', 'webinar', 'free_trial', 'demo_booking', 'newsletter'] as const;

// ─── Forms ───────────────────────────────────────────────────────────────────

export class FormFieldDto {
  @IsString()
  name: string;

  @IsIn(FIELD_TYPES)
  type: (typeof FIELD_TYPES)[number];

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateFormDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @IsOptional()
  @IsString()
  submitLabel?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsObject()
  styling?: Record<string, unknown>;
}

// ─── Funnel Steps ─────────────────────────────────────────────────────────────

export class FunnelStepDto {
  @IsString()
  name: string;

  @IsIn(STEP_TYPES)
  type: (typeof STEP_TYPES)[number];

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subheadline?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}

// ─── Funnels ─────────────────────────────────────────────────────────────────

export class CreateFunnelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsIn(FUNNEL_GOALS)
  goal?: (typeof FUNNEL_GOALS)[number];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  offerName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunnelStepDto)
  steps?: FunnelStepDto[];
}

export class AddFunnelStepDto extends FunnelStepDto {}

export class FunnelListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(FUNNEL_GOALS)
  goal?: (typeof FUNNEL_GOALS)[number];

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

// ─── Lead Capture ─────────────────────────────────────────────────────────────

export class CaptureLeadDto {
  @IsString()
  funnelId: string;

  @IsOptional()
  @IsString()
  stepId?: string;

  @IsOptional()
  @IsString()
  formId?: string;

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
  @IsObject()
  formData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;
}

export class CompleteStepDto {
  @IsString()
  sessionId: string;

  @IsString()
  stepId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export class OptimizeConversionDto {
  @IsString()
  funnelId: string;

  @IsOptional()
  @IsString()
  focusArea?: string;
}

export class SuggestFunnelStructureDto {
  @IsString()
  goal: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  pricePoint?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  stepCount?: number;
}
