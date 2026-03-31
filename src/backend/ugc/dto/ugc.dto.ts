import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import type {
  AvatarProvider,
  AvatarStyle,
  CreateUGCRenderRequest,
  GenerateUGCScriptRequest,
  VoiceGender,
} from '../ugc.types';

export class CreateUGCAvatarDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  style?: AvatarStyle;

  @IsOptional()
  @IsString()
  provider?: AvatarProvider;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  previewVideoUrl?: string;

  @IsOptional()
  @IsString()
  gender?: VoiceGender;

  @IsOptional()
  @IsString()
  ethnicityHint?: string;

  @IsOptional()
  @IsString()
  ageRange?: string;
}

export class UpdateUGCAvatarDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  style?: AvatarStyle;

  @IsOptional()
  @IsString()
  provider?: AvatarProvider;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  previewVideoUrl?: string;

  @IsOptional()
  @IsString()
  gender?: VoiceGender;

  @IsOptional()
  @IsString()
  ethnicityHint?: string;

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateVoiceCloneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  externalVoiceId?: string;

  @IsOptional()
  @IsUrl()
  sampleAudioUrl?: string;

  @IsOptional()
  @IsString()
  gender?: VoiceGender;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  stability?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityBoost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  styleExaggeration?: number;
}

export class UpdateVoiceCloneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  sampleAudioUrl?: string;

  @IsOptional()
  @IsString()
  gender?: VoiceGender;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  stability?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityBoost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  styleExaggeration?: number;
}

export class CreateUGCProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarId?: string;

  @IsOptional()
  @IsString()
  voiceCloneId?: string;

  @IsOptional()
  @IsString()
  brandContext?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class UpdateUGCProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarId?: string;

  @IsOptional()
  @IsString()
  voiceCloneId?: string;

  @IsOptional()
  @IsString()
  brandContext?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class GenerateUGCScriptDto implements GenerateUGCScriptRequest {
  @IsString()
  objective: 'awareness' | 'engagement' | 'conversions' | 'retention';

  @IsString()
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook';

  @IsInt()
  @Min(15)
  @Max(180)
  durationSeconds: number;

  @IsString()
  productOrOffer: string;

  @IsString()
  targetAudience: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  talkingPoints?: string[];
}

export class UpdateUGCScriptDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  scenesJson?: string;
}

export class CreateUGCRenderDto implements CreateUGCRenderRequest {
  @IsOptional()
  @IsBoolean()
  faceAnimation?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  lipSyncIntensity?: number;

  @IsOptional()
  @IsString()
  resolution?: '720p' | '1080p' | '4k';

  @IsOptional()
  @IsBoolean()
  enableCaptions?: boolean;

  @IsOptional()
  @IsBoolean()
  backgroundMusic?: boolean;

  @IsOptional()
  @IsString()
  aspectRatio?: '9:16' | '1:1' | '16:9';
}