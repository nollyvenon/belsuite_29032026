import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum AutopilotScope {
  CAMPAIGNS = 'campaigns',
  FUNNELS = 'funnels',
  MESSAGING = 'messaging',
  FULL_STACK = 'full_stack',
}

export class CreateAutopilotPolicyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AutopilotScope)
  scope?: AutopilotScope;

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(1000)
  pauseRoiThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(1000)
  scaleRoiThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  scaleBudgetPercent?: number;

  @IsOptional()
  @IsBoolean()
  autoRun?: boolean;

  @IsOptional()
  @IsString()
  runCron?: string;

  @IsOptional()
  @IsObject()
  constraints?: Record<string, unknown>;
}

export class TriggerAutopilotRunDto {
  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

export class AIAutopilotListQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
