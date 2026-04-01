import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkflowTypeDto {
  SCHEDULING = 'SCHEDULING',
  CONDITIONAL = 'CONDITIONAL',
  SEQUENCE = 'SEQUENCE',
  TRIGGER_BASED = 'TRIGGER_BASED',
  WEBHOOK = 'WEBHOOK',
}

export class WorkflowActionDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  actionType: string;

  @IsObject()
  config: Record<string, unknown>;
}

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(WorkflowTypeDto)
  type: WorkflowTypeDto;

  @IsObject()
  trigger: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  contentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions: WorkflowActionDto[];
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkflowTypeDto)
  type?: WorkflowTypeDto;

  @IsOptional()
  @IsObject()
  trigger?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  contentId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions?: WorkflowActionDto[];
}

export class AutomationListQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(WorkflowTypeDto)
  type?: WorkflowTypeDto;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class AutomationStatsQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  days?: number = 30;
}
