import {
  IsEnum, IsNumber, IsOptional, IsString, Max, Min,
} from 'class-validator';

export class TrackKeywordDto {
  @IsString() keyword: string;
  @IsString() domain: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsNumber() @Min(0) searchVolume?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) difficulty?: number;
}

export class BulkTrackKeywordsDto {
  @IsString() domain: string;
  keywords: string[];
  @IsOptional() @IsString() country?: string;
}

export class KeywordResearchDto {
  @IsString() seedKeyword: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(50) count?: number;
}

export class RankQueryDto {
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsNumber() @Min(1) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(200) limit?: number;
}
