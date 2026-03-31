import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsIn(['16:9', '9:16', '1:1'])
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export class GenerateFromScriptDto {
  @IsNotEmpty()
  @IsString()
  script!: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsIn(['cinematic', 'minimal', 'vibrant', 'dark'])
  style?: 'cinematic' | 'minimal' | 'vibrant' | 'dark';

  @IsOptional()
  @IsIn(['16:9', '9:16', '1:1'])
  aspectRatio?: '16:9' | '9:16' | '1:1';

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateTimelineDto {
  @IsNotEmpty()
  @IsString()
  timelineJson!: string;  // serialised TimelineState
}

export class RenderProjectDto {
  @IsOptional()
  @IsIn(['mp4', 'webm'])
  format?: 'mp4' | 'webm';

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  quality?: 'low' | 'medium' | 'high';
}

export class UploadUrlDto {
  @IsNotEmpty()
  @IsString()
  filename!: string;

  @IsNotEmpty()
  @IsString()
  mimeType!: string;
}

export class GenerateSubtitlesDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  burnIn?: boolean;
}

export class UpdateSceneDto {
  @IsOptional()
  @IsString()
  scriptSegment?: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  durationMs?: number;
}
