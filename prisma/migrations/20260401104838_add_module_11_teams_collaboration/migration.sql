-- CreateEnum for TeamRole
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER', 'APPROVER');

-- CreateEnum for ApprovalStatus
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'CANCELLED');

-- CreateEnum for TeamInvitationStatus
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateTable Team
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER,
    "metadata" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable TeamMember
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable TeamInvitation
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedEmail" VARCHAR(255) NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "declinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable TeamWorkflow
CREATE TABLE "TeamWorkflow" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "requiresApprovals" BOOLEAN NOT NULL DEFAULT true,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "allowRejectReason" BOOLEAN NOT NULL DEFAULT true,
    "applicableContentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerConfig" TEXT,
    "notificationConfig" TEXT,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkflowApproval
CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "contentId" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(128) NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "rejectionReason" TEXT,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "receivedApprovals" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentSnapshot" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable Approval
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" VARCHAR(32),
    "decisionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable TeamAuditLog
CREATE TABLE "TeamAuditLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(128) NOT NULL,
    "resourceType" VARCHAR(128) NOT NULL,
    "resourceId" TEXT,
    "changes" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Team
CREATE UNIQUE INDEX "Team_organizationId_slug_key" ON "Team"("organizationId", "slug");
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");
CREATE INDEX "Team_createdById_idx" ON "Team"("createdById");
CREATE INDEX "Team_createdAt_idx" ON "Team"("createdAt");
CREATE INDEX "Team_archivedAt_idx" ON "Team"("archivedAt");

-- CreateIndex for TeamMember
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX "TeamMember_role_idx" ON "TeamMember"("role");
CREATE INDEX "TeamMember_isActive_idx" ON "TeamMember"("isActive");

-- CreateIndex for TeamInvitation
CREATE UNIQUE INDEX "TeamInvitation_teamId_invitedEmail_key" ON "TeamInvitation"("teamId", "invitedEmail");
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");
CREATE INDEX "TeamInvitation_teamId_idx" ON "TeamInvitation"("teamId");
CREATE INDEX "TeamInvitation_invitedEmail_idx" ON "TeamInvitation"("invitedEmail");
CREATE INDEX "TeamInvitation_status_idx" ON "TeamInvitation"("status");
CREATE INDEX "TeamInvitation_expiresAt_idx" ON "TeamInvitation"("expiresAt");

-- CreateIndex for TeamWorkflow
CREATE INDEX "TeamWorkflow_teamId_idx" ON "TeamWorkflow"("teamId");
CREATE INDEX "TeamWorkflow_isActive_idx" ON "TeamWorkflow"("isActive");

-- CreateIndex for WorkflowApproval
CREATE INDEX "WorkflowApproval_workflowId_idx" ON "WorkflowApproval"("workflowId");
CREATE INDEX "WorkflowApproval_contentId_idx" ON "WorkflowApproval"("contentId");
CREATE INDEX "WorkflowApproval_submittedById_idx" ON "WorkflowApproval"("submittedById");
CREATE INDEX "WorkflowApproval_status_idx" ON "WorkflowApproval"("status");
CREATE INDEX "WorkflowApproval_submittedAt_idx" ON "WorkflowApproval"("submittedAt");
CREATE INDEX "WorkflowApproval_expiresAt_idx" ON "WorkflowApproval"("expiresAt");

-- CreateIndex for Approval
CREATE UNIQUE INDEX "Approval_approvalRequestId_approverId_key" ON "Approval"("approvalRequestId", "approverId");
CREATE INDEX "Approval_approvalRequestId_idx" ON "Approval"("approvalRequestId");
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");
CREATE INDEX "Approval_decision_idx" ON "Approval"("decision");
CREATE INDEX "Approval_expiresAt_idx" ON "Approval"("expiresAt");

-- CreateIndex for TeamAuditLog
CREATE INDEX "TeamAuditLog_teamId_idx" ON "TeamAuditLog"("teamId");
CREATE INDEX "TeamAuditLog_userId_idx" ON "TeamAuditLog"("userId");
CREATE INDEX "TeamAuditLog_action_idx" ON "TeamAuditLog"("action");
CREATE INDEX "TeamAuditLog_timestamp_idx" ON "TeamAuditLog"("timestamp");
CREATE INDEX "TeamAuditLog_resourceType_idx" ON "TeamAuditLog"("resourceType");

-- AddForeignKey for Team
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for TeamMember
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for TeamInvitation
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for TeamWorkflow
ALTER TABLE "TeamWorkflow" ADD CONSTRAINT "TeamWorkflow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for WorkflowApproval
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "TeamWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for Approval
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "WorkflowApproval"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for TeamAuditLog
ALTER TABLE "TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
