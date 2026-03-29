import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ContentTypeEnum {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  CAROUSEL = 'CAROUSEL',
  STORY = 'STORY',
  REELS = 'REELS',
  AUTOMATION_TEMPLATE = 'AUTOMATION_TEMPLATE',
}

export class CreateContentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ContentTypeEnum)
  type: ContentTypeEnum;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}
