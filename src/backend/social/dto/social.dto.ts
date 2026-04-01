/**
 * Social Media Scheduler — DTOs with class-validator decorators
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SocialPlatform } from '@prisma/client';

// ── Account ───────────────────────────────────────────────────────────────────

export class ConnectAccountDto {
  @IsString()
  code!: string;

  @IsString()
  redirectUri!: string;

  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(63206) // Facebook max; platform validation done in service
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accountIds!: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  autoRepostEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  repostIntervalDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxReposts?: number;

  @IsOptional()
  @IsBoolean()
  useOptimalTime?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(63206)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accountIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  autoRepostEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  repostIntervalDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxReposts?: number;
}

// ── Bulk ──────────────────────────────────────────────────────────────────────

export class BulkCreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreatePostDto)
  posts!: CreatePostDto[];
}

// ── AI Creator ────────────────────────────────────────────────────────────────

export class AutoCreatorDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  prompt!: string;

  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  @ArrayMinSize(1)
  platforms!: SocialPlatform[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;

  @IsOptional()
  @IsBoolean()
  useOptimalTime?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];
}

export class GenerateCaptionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  content!: string;

  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;
}

// ── Reschedule ────────────────────────────────────────────────────────────────

export class RescheduleDto {
  @IsDateString()
  scheduledAt!: string;
}

export class BlackoutWindowDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ArrayMinSize(1)
  daysOfWeek!: number[];

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class UpdateSchedulingPolicyDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  minimumLeadMinutes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlackoutWindowDto)
  blackoutWindows?: BlackoutWindowDto[];
}

export class SchedulePreviewDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms?: SocialPlatform[];

  @IsOptional()
  @IsDateString()
  after?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  count?: number;
}

// ── Query filters ─────────────────────────────────────────────────────────────

export class ListPostsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
