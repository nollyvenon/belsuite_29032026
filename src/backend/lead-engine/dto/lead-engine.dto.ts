import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LeadProspectDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  companySize?: number;

  @IsOptional()
  @IsNumber()
  annualRevenue?: number;
}

export class ScrapeLeadsDto {
  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  idealCustomerProfile?: string;

  @IsArray()
  prospects: LeadProspectDto[];
}

export class LeadListQueryDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;

  @IsOptional()
  @IsString()
  q?: string;

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

export class EnrichLeadDto {
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  companySize?: number;

  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @IsOptional()
  @IsString()
  technologyStack?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PredictLeadStrategyDto {
  @IsString()
  fullName: string;

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
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  companySize?: number;

  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @IsOptional()
  @IsString()
  idealCustomerProfile?: string;
}

export class TrackVisitorDto {
  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
