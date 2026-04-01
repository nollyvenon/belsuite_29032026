# Module 11: Teams & Collaboration API Reference

## Base URL
```
/api/teams
```

## Authentication
All endpoints require: `Authorization: Bearer <JWT_TOKEN>`

## Team Management

### 1. Create Team
```
POST /api/teams
Content-Type: application/json

Request Body:
{
  "name": "Content Team",
  "description": "Our content creation team",
  "isPublic": false,
  "requiresApproval": true,
  "maxMembers": 50
}

Response (201):
{
  "id": "cuid_...",
  "organizationId": "org_...",
  "name": "Content Team",
  "slug": "content-team",
  "description": "Our content creation team",
  "isPublic": false,
  "requiresApproval": true,
  "memberCount": 1,
  "maxMembers": 50,
  "createdById": "user_...",
  "createdAt": "2026-04-01T...",
  "updatedAt": "2026-04-01T...",
  "archivedAt": null
}
```

### 2. List Teams
```
GET /api/teams?page=1&pageSize=20&search=content&sortBy=createdAt&sortOrder=desc

Response (200):
{
  "teams": [
    { /* team object */ },
    ...
  ],
  "total": 5,
  "page": 1,
  "pageSize": 20
}
```

### 3. Get Team Details
```
GET /api/teams/:teamId

Response (200):
{
  ...team properties...,
  "members": [
    {
      "id": "member_...",
      "userId": "user_...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "role": "EDITOR",
      "joinedAt": "2026-04-01T...",
      "lastActivityAt": "2026-04-01T...",
      "permissions": ["team:read", "content:create", "content:update", "approval:submit", ...]
    },
    ...
  ],
  "memberCount": 5
}
```

### 4. Update Team
```
PUT /api/teams/:teamId
Content-Type: application/json

Request Body:
{
  "name": "Updated Name",
  "description": "Updated description",
  "isPublic": true,
  "requiresApproval": true,
  "maxMembers": 100
}

Response (200):
{ /* updated team object */ }

Required Roles: OWNER, ADMIN
```

### 5. Archive Team
```
DELETE /api/teams/:teamId

Response (204): No Content

Required Roles: OWNER
```

## Member Management

### 1. Get Team Members
```
GET /api/teams/:teamId/members

Response (200):
[
  {
    "id": "member_...",
    "userId": "user_...",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "role": "EDITOR",
    "joinedAt": "2026-04-01T...",
    "lastActivityAt": "2026-04-01T...",
    "permissions": [...]
  },
  ...
]
```

### 2. Invite Member
```
POST /api/teams/:teamId/members/invite
Content-Type: application/json

Request Body:
{
  "email": "newmember@example.com",
  "role": "EDITOR",
  "message": "Welcome to our team!"
}

Response (201):
{
  "id": "invitation_...",
  "teamId": "team_...",
  "invitedEmail": "newmember@example.com",
  "role": "EDITOR",
  "invitedBy": "user_...",
  "token": "uuid_...",
  "expiresAt": "2026-04-08T...",
  "status": "PENDING",
  "message": "Welcome to our team!",
  "createdAt": "2026-04-01T..."
}

Required Roles: OWNER, ADMIN
```

### 3. Accept Invitation
```
POST /api/teams/:teamId/members/add?token=<INVITATION_TOKEN>

Response (201):
{
  "id": "member_...",
  "teamId": "team_...",
  "userId": "user_...",
  "role": "EDITOR",
  "joinedAt": "2026-04-01T...",
  "permissions": [...]
}

Note: Token obtained from invitation email/URL
```

### 4. Remove Member
```
DELETE /api/teams/:teamId/members/:memberId

Response (204): No Content

Required Roles: OWNER, ADMIN
Restrictions: Cannot remove OWNER (unless self-removing)
```

### 5. Update Member Role
```
PUT /api/teams/:teamId/members/:memberId/role
Content-Type: application/json

Request Body:
{
  "role": "ADMIN"
}

Response (200):
[
  "id": "member_...",
  "role": "ADMIN",
  "permissions": [...]
]

Required Roles: OWNER, ADMIN
Restrictions: Cannot change OWNER role (unless OWNER changing own role)
```

## Approval Workflows

### 1. Create Workflow
```
POST /api/teams/:teamId/workflows
Content-Type: application/json

Request Body:
{
  "name": "Content Review",
  "description": "Review all content before publishing",
  "requiredApprovals": 2,
  "requiresApprovals": true,
  "allowRejectReason": true,
  "applicableContentTypes": ["video", "post", "article"],
  "triggerConfig": { /* optional */ },
  "notificationConfig": { /* optional */ }
}

Response (201):
{
  "id": "workflow_...",
  "teamId": "team_...",
  "name": "Content Review",
  "description": "Review all content before publishing",
  "requiresApprovals": true,
  "requiredApprovals": 2,
  "allowRejectReason": true,
  "applicableContentTypes": ["video", "post", "article"],
  "isActive": true,
  "totalSubmissions": 0,
  "approvedCount": 0,
  "rejectedCount": 0,
  "createdAt": "2026-04-01T..."
}

Required Roles: OWNER, ADMIN
```

### 2. Submit for Approval
```
POST /api/teams/:teamId/approvals/submit
Content-Type: application/json

Request Body:
{
  "contentId": "content_123",
  "contentType": "video",
  "comments": "Please review and approve for publishing",
  "version": 1,
  "contentSnapshot": {
    "title": "New Video",
    "description": "...",
    "tags": ["tag1", "tag2"]
  }
}

Response (201):
{
  "id": "approval_...",
  "workflowId": "workflow_...",
  "contentId": "content_123",
  "contentType": "video",
  "submittedById": "user_...",
  "status": "PENDING",
  "comments": "Please review and approve for publishing",
  "requiredApprovals": 2,
  "receivedApprovals": 0,
  "version": 1,
  "submittedAt": "2026-04-01T...",
  "dueAt": null,
  "approvedAt": null,
  "rejectedAt": null
}

Required Roles: OWNER, ADMIN, EDITOR, CONTRIBUTOR
Trigger: Auto-creates approval request with first available approver assigned
```

### 3. Get Pending Approvals
```
GET /api/teams/:teamId/approvals/pending?page=1&pageSize=20

Response (200):
{
  "approvals": [
    {
      "id": "approval_...",
      "workflowId": "workflow_...",
      "contentId": "content_123",
      "contentType": "video",
      "status": "PENDING",
      "requiredApprovals": 2,
      "receivedApprovals": 1,
      "submittedBy": {
        "id": "user_...",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "myDecision": null,
      "myResponse": null,
      "submittedAt": "2026-04-01T...",
      "dueAt": null
    },
    ...
  ],
  "total": 5,
  "page": 1,
  "pageSize": 20
}

Required Roles: OWNER, ADMIN, APPROVER
Only returns approvals where user is a potential approver
```

### 4. Respond to Approval
```
POST /api/teams/:teamId/approvals/:approvalId/respond
Content-Type: application/json

Request Body:
{
  "decision": "APPROVED",
  "decisionReason": "Looks good to publish!"
}

Response (200):
{
  "id": "response_...",
  "approvalRequestId": "approval_...",
  "approverId": "user_...",
  "decision": "APPROVED",
  "decisionReason": "Looks good to publish!",
  "requestedAt": "2026-04-01T...",
  "respondedAt": "2026-04-01T..."
}

Decision Options: "APPROVED" or "REJECTED"

Auto-completion Logic:
- If all required approvals received → approval.status = "APPROVED"
- If any rejection received → approval.status = "REJECTED"
- Otherwise → approval.status = "PENDING"

Required Roles: OWNER, ADMIN, APPROVER
Restrictions: Cannot vote twice
```

## Team Roles & Permissions

### Roles:
- **OWNER**: Full control (cannot be removed/demoted by others)
  - Permissions: Create/update/delete team, manage all members, manage workflows, approve content
  
- **ADMIN**: Administrative privileges
  - Permissions: Update team, manage members, manage workflows, approve content
  
- **EDITOR**: Can create and publish content
  - Permissions: Create/update/delete content, publish, submit for approval
  
- **CONTRIBUTOR**: Can create content (needs approval to publish)
  - Permissions: Create/update content, submit for approval
  
- **APPROVER**: Can review and approve content only
  - Permissions: View team, approve content
  
- **VIEWER**: Read-only access
  - Permissions: View team and content

### Permission Model:
Permissions are cached on TeamMember as JSON array for performance:
```
"permissions": [
  "team:create",      // Can create team
  "team:read",        // Can view team
  "team:update",      // Can update team
  "team:delete",      // Can archive team
  "team:manage_members",  // Can add/remove members
  "team:manage_workflows", // Can create workflows
  "team:manage_approvals", // Can manage approval settings
  "team:view_audit",   // Can view audit logs
  "content:create",    // Can create content
  "content:read",      // Can view content
  "content:update",    // Can edit content
  "content:delete",    // Can delete content
  "content:publish",   // Can publish content
  "approval:submit",   // Can submit for approval
  "approval:approve"   // Can approve content
]
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Team has reached maximum member limit"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "User is not a member of this team"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Team not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User already invited or is member of this team"
}
```

## Example Workflows

### Workflow 1: Create Team & Add Members
```
1. POST /api/teams → Create team (user becomes OWNER)
2. POST /api/teams/:teamId/members/invite → Invite members
3. Invitee receives email with invitation link/token
4. Invitee clicks link → POST /api/teams/:teamId/members/add?token=... → Joins team
```

### Workflow 2: Submit Content for Approval
```
1. CONTRIBUTOR creates content in your system
2. POST /api/teams/:teamId/approvals/submit → Submit for approval
3. APPROVER receives notification
4. GET /api/teams/:teamId/approvals/pending → Fetch pending approvals
5. POST /api/teams/:teamId/approvals/:approvalId/respond → Approve or reject
6. System updates approval status based on required_approvals met
7. Workflow auto-publishes when all approvals received
```

### Workflow 3: Update Team Member Role
```
1. ADMIN wants to promote CONTRIBUTOR to EDITOR
2. PUT /api/teams/:teamId/members/:memberId/role
   {"role": "EDITOR"}
3. Member permissions updated automatically
4. Audit log recorded
```
