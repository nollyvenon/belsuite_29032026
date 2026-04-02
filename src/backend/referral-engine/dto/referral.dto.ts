import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RevenueQueryDto {
  @IsOptional() @IsNumber() @Min(1) days?: number;
}

export class CreateReferralLinkDto {
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @IsString() rewardType?: string;
  @IsOptional() @IsNumber() rewardValue?: number;
  @IsOptional() @IsNumber() maxUses?: number;
  @IsOptional() @IsString() expiresAt?: string;
}

export class TrackReferralDto {
  @IsString() code: string;
  @IsOptional() @IsString() referredEmail?: string;
  @IsOptional() @IsString() referredUserId?: string;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() userAgent?: string;
}
