import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class InviteMemberDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  roleId?: string;
}

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class OrganizationDetailDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  tier: string;
  maxMembers: number;
  maxProjects: number;
  maxStorageGB: number;
  usedStorageGB: number;
  createdAt: Date;
}
