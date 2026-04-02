import {
  IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min,
} from 'class-validator';
import { DealPriority, DealStage } from '@prisma/client';

export class CreateDealDto {
  @IsString() title: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @IsOptional() @IsEnum(DealPriority) priority?: DealPriority;
  @IsOptional() @IsNumber() value?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsString() expectedCloseAt?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() sourceLeadId?: string;
  @IsOptional() @IsString() pipelineName?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsObject() properties?: Record<string, unknown>;
  @IsOptional() tags?: string[];
}

export class UpdateDealDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @IsOptional() @IsEnum(DealPriority) priority?: DealPriority;
  @IsOptional() @IsNumber() value?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsString() expectedCloseAt?: string;
  @IsOptional() @IsString() closedAt?: string;
  @IsOptional() @IsString() lostReason?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() ownerId?: string;
}

export class AddActivityDto {
  @IsString() contactEmail: string;
  @IsOptional() @IsString() contactName?: string;
  @IsString() activityType: string;
  @IsOptional() @IsString() dealId?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsString() performedBy?: string;
}

export class DealQueryDto {
  @IsOptional() @IsString() stage?: DealStage;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsNumber() @Min(1) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(200) limit?: number;
}
