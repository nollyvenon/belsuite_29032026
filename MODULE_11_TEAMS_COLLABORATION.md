# MODULE 11: ADVANCED TEAMS & COLLABORATION PLATFORM

**Status:** Planning  
**Priority:** High  
**Phase:** Post-MVP Foundation  
**Estimated Work:** 4-6 weeks

## Overview
Module 11 transforms BelSuite from a single-user platform into a true team collaboration system. It adds fine-grained permissions, real-time collaboration, audit trails, approval workflows, and team analytics—enabling organizations to scale content production and maintain control over brand assets.

## Key Objectives
1. **Role-Based Access Control (RBAC)** — granular permissions across all modules
2. **Team Workspace** — real-time collaboration and asset sharing
3. **Approval Workflows** — content review and sign-off before publishing
4. **Audit & Compliance** — complete activity logs and compliance exports
5. **Team Analytics** — performance tracking and productivity insights
6. **Real-time Notifications** — WebSocket-based team updates

## Architecture

### Backend (NestJS)
```
src/backend/
├── teams/                        # NEW: Team management service
│   ├── teams.controller.ts
│   ├── teams.service.ts
│   ├── dtos/
│   │   ├── create-team.dto.ts
│   │   ├── update-team.dto.ts
│   │   └── team-member.dto.ts
│   └── entities/
│       ├── team.entity.ts
│       └── team-member.entity.ts
├── rbac/                         # ENHANCE: Permissions system
│   ├── rbac.module.ts
│   ├── rbac.service.ts
│   ├── dtos/
│   │   ├── role.dto.ts
│   │   ├── permission.dto.ts
│   │   └── resource-access.dto.ts
│   └── decorators/
│       ├── require-permission.decorator.ts
│       ├── require-role.decorator.ts
│       └── audit-log.decorator.ts
├── workflows/                    # NEW: Approval workflows
│   ├── workflows.controller.ts
│   ├── workflows.service.ts
│   ├── dtos/
│   │   ├── create-workflow.dto.ts
│   │   └── workflow-approval.dto.ts
│   └── entities/
│       ├── workflow.entity.ts
│       └── workflow-approval.entity.ts
├── notifications/                # NEW: Real-time notifications
│   ├── notifications.gateway.ts  # WebSocket gateway
│   ├── notifications.service.ts
│   ├── notifications.module.ts
│   └── dtos/
│       ├── notification.dto.ts
│       └── notification-preferences.dto.ts
├── audit/                        # NEW: Audit logging
│   ├── audit.service.ts
│   ├── audit.module.ts
│   ├── dtos/
│   │   ├── audit-log.dto.ts
│   │   └── audit-export.dto.ts
│   └── entities/
│       └── audit-log.entity.ts
└── analytics/                    # ENHANCE: Team analytics
    ├── team-analytics.service.ts  # NEW endpoints
    ├── dtos/
    │   ├── team-performance.dto.ts
    │   └── contributor-stats.dto.ts
```

### Database (Prisma Schema Extensions)
```prisma
model Team {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  description     String?
  organizationId  String    // Link to tenant
  owner           User      @relation("TeamOwner", fields: [ownerId], references: [id])
  ownerId         String
  members         TeamMember[]
  workflows       Workflow[]
  auditLogs       AuditLog[]
  settings        TeamSettings?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([organizationId, slug])
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     // Owner, Admin, Editor, Viewer, Contributor
  permissions String[] // JSON array of specific permissions
  joinedAt  DateTime @default(now())
  invitedBy String?  // User ID who invited them

  @@unique([teamId, userId])
}

model Workflow {
  id          String   @id @default(cuid())
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  name        String
  description String?
  trigger     String   // "manual", "onPublish", "on_schedule"
  steps       WorkflowStep[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowApproval {
  id          String   @id @default(cuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])
  resourceId  String   // Video/Post/Campaign ID
  status      String   // "pending", "approved", "rejected"
  approverIds String[]
  approvals   Approval[]
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}

model Approval {
  id           String   @id @default(cuid())
  approvalId   String
  approval     WorkflowApproval @relation(fields: [approvalId], references: [id])
  approveById  String
  approvedBy   User     @relation(fields: [approveById], references: [id])
  status       String   // "approved", "rejected"
  comment      String?
  approvedAt   DateTime @default(now())
}

model AuditLog {
  id          String   @id @default(cuid())
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  action      String   // "create", "update", "delete", "publish", "approve"
  resource    String   // "video", "post", "campaign", "team_member"
  resourceId  String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  changes     String?  // JSON of what changed
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([teamId, createdAt])
}

model NotificationPreference {
  id      String @id @default(cuid())
  userId  String @unique
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  approvals     Boolean @default(true)
  teamActivity  Boolean @default(true)
  mentions      Boolean @default(true)
  dailyDigest   Boolean @default(false)
}
```

## Frontend (React/Next.js)

### New Pages & Routes
```
src/app/
├── teams/                        # NEW: Teams management hub
│   ├── page.tsx                  # Teams list
│   ├── [teamId]/                 # Team workspace
│   │   ├── page.tsx              # Team overview
│   │   ├── members/
│   │   │   └── page.tsx          # Team members & invites
│   │   ├── workflows/
│   │   │   └── page.tsx          # Approval workflows
│   │   ├── audit/
│   │   │   └── page.tsx          # Audit logs & export
│   │   └── settings/
│   │       └── page.tsx          # Team settings
└── notifications/                # NEW: Notifications center
    └── page.tsx

src/components/teams/             # NEW: Team components
├── TeamsList.tsx
├── TeamSwitcher.tsx
├── TeamMembersList.tsx
├── TeamInviteModal.tsx
├── RoleSelector.tsx
├── PermissionGrid.tsx

src/components/workflows/         # NEW: Workflow components
├── WorkflowBuilder.tsx
├── ApprovalPendingCard.tsx
├── ApprovalHistoryPanel.tsx
├── WorkflowTemplates.tsx

src/components/audit/             # NEW: Audit components
├── AuditLogTable.tsx
├── AuditExportButton.tsx
├── ActivityTimeline.tsx

src/components/notifications/     # NEW: Notification components
├── NotificationCenter.tsx
├── NotificationBell.tsx
├── NotificationPreferences.tsx
```

### New Stores (Zustand)
```typescript
src/stores/
├── team-store.ts                 # Current team & members
├── rbac-store.ts                 # User permissions cache
├── notification-store.ts         # Notification state
├── approval-store.ts             # Pending approvals
└── audit-store.ts                # Audit log filtering
```

### New Hooks
```typescript
src/hooks/
├── useTeam.ts                    # Load/switch teams
├── useTeamMembers.ts             # Fetch team members
├── usePermission.ts              # Check user permission
├── useWorkflows.ts               # CRUD workflows
├── useApprovals.ts               # Pending approvals
├── useAuditLogs.ts               # Query audit logs
├── useNotifications.ts           # WebSocket subscription
└── useTeamAnalytics.ts           # Team performance
```

## Mobile (Flutter)

### New Screens
```
apps/mobile/lib/src/screens/
├── teams_screen.dart             # Team selection & list
├── team_workspace_screen.dart    # Team collaboration hub
├── team_members_screen.dart      # Member management
├── approvals_screen.dart         # Pending approvals
├── audit_log_screen.dart         # Audit log viewer
└── notifications_screen.dart     # Notification center
```

## Desktop (Electron)

### New Features
- Team workspace window
- Real-time notification popups
- Approval notifications with quick-action buttons
- Audit log export to PDF/CSV

## API Endpoints (NestJS)

### Team Management
```
POST   /api/teams                          # Create team
GET    /api/teams                          # List teams
GET    /api/teams/:teamId                  # Get team
PUT    /api/teams/:teamId                  # Update team
DELETE /api/teams/:teamId                  # Delete team
POST   /api/teams/:teamId/members          # Invite member
GET    /api/teams/:teamId/members          # List members
PUT    /api/teams/:teamId/members/:userId  # Update member role
DELETE /api/teams/:teamId/members/:userId  # Remove member
```

### Workflows & Approvals
```
POST   /api/teams/:teamId/workflows        # Create workflow
GET    /api/teams/:teamId/workflows        # List workflows
PUT    /api/teams/:teamId/workflows/:id    # Update workflow
DELETE /api/teams/:teamId/workflows/:id    # Delete workflow
GET    /api/approvals                      # List pending approvals
POST   /api/approvals/:id/approve          # Approve resource
POST   /api/approvals/:id/reject           # Reject resource
```

### Audit & Compliance
```
GET    /api/teams/:teamId/audit            # Get audit logs (paginated)
POST   /api/teams/:teamId/audit/export     # Export audit logs (PDF/CSV)
GET    /api/audit/compliance-reports       # Pre-built compliance reports
```

### Notifications
```
WS     /api/ws/notifications               # WebSocket connection
GET    /api/notifications                  # Get notification history
POST   /api/notifications/preferences      # Update preferences
POST   /api/notifications/:id/read         # Mark as read
```

## Key Workflows

### Approval Workflow
1. User creates content (video, post, campaign)
2. Workflow trigger fires (manual or automatic)
3. Approval tasks created for designated reviewers
4. Reviewers receive notifications
5. Reviewers approve/reject with comments
6. Upon all approvals, resource is published/activated
7. Full history logged in audit trail

### Real-time Collaboration
1. Team members open shared workspace
2. WebSocket subscription to team channel
3. Changes (edits, comments, approvals) broadcast in real-time
4. Notifications appear in notification center and browser
5. Activity logged with user/timestamp/IP for audit

### Team Onboarding
1. Owner creates team
2. Invites team members via email or link
3. Members join and are assigned roles
4. Permissions are granted based on role
5. Team members see shared content/workflows
6. Audit log captures all actions

## Data Models Summary

**Core Entities:**
- `Team` — team workspace
- `TeamMember` — user + role + permissions
- `Workflow` — approval workflow definition
- `WorkflowApproval` — approval task instance
- `Approval` — individual approver decision
- `AuditLog` — immutable activity record
- `NotificationPreference` — user notification settings

## Roles & Permissions

### Built-in Roles
1. **Owner** — Full control, can delete team
2. **Admin** — Manage members, workflows, settings
3. **Editor** — Create/edit content, submit for approval
4. **Contributor** — Create own content
5. **Viewer** — Read-only access
6. **Approver** — Review and approve submissions

### Permission Matrix
| Action | Owner | Admin | Editor | Contributor | Viewer | Approver |
|--------|-------|-------|--------|-------------|--------|----------|
| View Team | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invite Members | ✓ | ✓ | | | | |
| Manage Roles | ✓ | ✓ | | | | |
| Create Content | ✓ | ✓ | ✓ | ✓ | | |
| Edit Content | ✓ | ✓ | ✓* | ✓* | | |
| Delete Content | ✓ | ✓ | ✓* | ✓* | | |
| Publish Content | ✓ | ✓ | ✓* | | | |
| Approve Content | ✓ | ✓ | | | | ✓ |
| View Audit Logs | ✓ | ✓ | ✓ | | | |
| Export Audit Logs | ✓ | ✓ | | | | |
| Manage Workflows | ✓ | ✓ | | | | |
| Delete Team | ✓ | | | | | |

*With approval if workflow enabled

## Security & Compliance

- **Audit Trail** — every action logged with user, timestamp, IP, user agent
- **Encryption** — sensitive fields encrypted at rest
- **Rate Limiting** — API throttling per team/user
- **Compliance Exports** — SOC2, GDPR-ready audit exports
- **Permission Caching** — in-memory permission cache with TTL
- **WebSocket Auth** — JWT validation on WS connection

## Integration Points

- **Email Service** — team invites, approval notifications, digest emails
- **Analytics** — team performance metrics in dashboard
- **Webhooks** — approval events, team activity events
- **Third-party Auth** — SSO for team members (future)

## Launch Sequence

1. **Phase 1 (Week 1-2):** Backend teams, members, permissions
2. **Phase 2 (Week 2-3):** Frontend team management UI
3. **Phase 3 (Week 3-4):** Approval workflows backend & UI
4. **Phase 4 (Week 4-5):** Real-time notifications & audit logs
5. **Phase 5 (Week 5-6):** Mobile/Desktop integration, testing, docs

## Success Metrics

- Team creation adoption rate
- Approval workflow usage
- Audit log export requests
- Team member growth
- Real-time notification engagement
- Workflow approval SLA compliance

## Future Enhancements

- SSO (Okta, Azure AD, Google Workspace)
- Scoped API keys per team
- Advanced analytics dashboards
- Scheduled report generation
- Slack/Teams integration
- Zapier/Make.com automation
- Custom role builder UI
- Bulk member import (CSV)
- IP-based access control
