import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateSeoContentDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  primaryKeyword?: string;

  @IsOptional()
  @IsArray()
  secondaryKeywords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(5000)
  wordCount?: number;

  @IsOptional()
  @IsString()
  tone?: string;
}

export class TrackBacklinkDto {
  @IsString()
  sourceUrl: string;

  @IsString()
  targetUrl: string;

  @IsOptional()
  @IsString()
  anchorText?: string;

  @IsOptional()
  @IsString()
  linkType?: 'guest_post' | 'directory' | 'web2' | 'editorial' | 'citation';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sourceDomainAuthority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore?: number;
}

export class BacklinkQueryDto {
  @IsOptional()
  @IsString()
  linkType?: string;

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

export class CompetitorBacklinkAnalysisDto {
  @IsArray()
  competitorDomains: string[];

  @IsOptional()
  @IsArray()
  targetKeywords?: string[];
}

export class KeywordClusterDto {
  @IsArray()
  keywords: string[];

  @IsOptional()
  @IsString()
  businessContext?: string;
}

export class OutreachEmailDto {
  @IsString()
  targetSite: string;

  @IsString()
  yourOffer: string;

  @IsOptional()
  @IsString()
  targetKeyword?: string;

  @IsOptional()
  @IsString()
  tone?: string;
}
