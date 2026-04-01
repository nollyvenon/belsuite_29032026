import { IsString, IsOptional, IsNotEmpty, IsBoolean, IsInt, IsEmail, IsEnum, IsArray, Min } from 'class-validator';

export enum TeamRoleEnum {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER',
  APPROVER = 'APPROVER',
}

// ─── Create Team ──────────────────────────────────────────────
export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembers?: number;
}

// ─── Update Team ──────────────────────────────────────────────
export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembers?: number;
}

// ─── Invite Member ───────────────────────────────────────────
export class InviteTeamMemberDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(TeamRoleEnum)
  role: TeamRoleEnum;

  @IsOptional()
  @IsString()
  message?: string;
}

// ─── Update Member Role ───────────────────────────────────────
export class UpdateTeamMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(TeamRoleEnum)
  role: TeamRoleEnum;
}

// ─── Accept Invitation ───────────────────────────────────────
export class AcceptTeamInvitationDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

// ─── Create Workflow ────────────────────────────────────────
export class CreateTeamWorkflowDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredApprovals?: number;

  @IsOptional()
  @IsBoolean()
  requiresApprovals?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRejectReason?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableContentTypes?: string[];

  @IsOptional()
  triggerConfig?: Record<string, any>;

  @IsOptional()
  notificationConfig?: Record<string, any>;
}

// ─── Submit for Approval ────────────────────────────────────
export class SubmitForApprovalDto {
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  version?: number;

  @IsOptional()
  contentSnapshot?: Record<string, any>;
}

// ─── Respond to Approval ────────────────────────────────────
export class RespondToApprovalDto {
  @IsNotEmpty()
  @IsString()
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  decisionReason?: string;
}

// ─── List/Response DTOs ────────────────────────────────────
export class TeamMemberResponseDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: TeamRoleEnum;
  joinedAt: Date;
  lastActivityAt?: Date;
  permissions: string[];
}

export class TeamResponseDto {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  memberCount: number;
  maxMembers?: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export class TeamDetailDto extends TeamResponseDto {
  members: TeamMemberResponseDto[];
  memberCount: number;
}

export class WorkflowStatusDto {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  requiredApprovals: number;
  isActive: boolean;
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  createdAt: Date;
}

export class ApprovalStatusDto {
  id: string;
  workflowId: string;
  contentId: string;
  contentType: string;
  status: string;
  requiredApprovals: number;
  receivedApprovals: number;
  submittedAt: Date;
  dueAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export class TeamListResponseDto {
  teams: TeamResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
