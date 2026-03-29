# Belsuite Architecture & Design Document

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├──────────────────┬──────────────────┬──────────────────────┤
│   Next.js Web    │  React Native    │   Electron Desktop   │
│  (Port 3000)     │   (Mobile)       │    (Desktop)         │
└──────────────────┴──────────────────┴──────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (Express + CORS + Rate Limit)                  │
└─────────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │     JWT    │  │   Tenant   │  │ Permission │
    │  Strategy  │  │  Middleware│  │   Guard    │
    └────────────┘  └────────────┘  └────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Application                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth Module      │ Users Module   │ Organizations   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  RBAC Module      │ Content Module │ Subscriptions   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Automation       │ Analytics      │ AI Services     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Storage Service  │ Jobs Queue     │ Notifications   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
    │           │            │          │         │
    ▼           ▼            ▼          ▼         ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐
│  Prisma│ │ Redis  │ │Meilisearch│ │ AWS   │ │  BullMQ  │
│   ORM  │ │ Cache  │ │  Search   │ │  S3   │ │  Queue   │
│        │ │ Session│ │           │ │Storage│ │ Messages │
└────────┘ └────────┘ └──────────┘ └───────┘ └──────────┘
    │           │            │          │         │
    └─────────┬─┴──────┬─────┴──────┬───┴─────┬──┘
              ▼        ▼            ▼         ▼
         ┌─────────────────────────────────────┐
         │     PostgreSQL (Primary DB)          │
         │  - Row-level Multi-tenancy           │
         │  - Encrypted Credentials             │
         │  - Audit Logging                     │
         └─────────────────────────────────────┘
```

## Multi-Tenancy Implementation

### Three-Layer Isolation

**Layer 1: Data Isolation**
```prisma
model Content {
  organizationId String  // Every row tagged
  @@index([organizationId])  // Indexed for speed
}
```

**Layer 2: Query Filtering**
```typescript
// All queries automatically filtered
const content = await prisma.content.findMany({
  where: {
    organizationId: userOrgId  // Required in every query
  }
});
```

**Layer 3: JWT Storage**
```typescript
// Token contains org context
{
  sub: "user-id",
  orgId: "org-id",  // Tenant context
  permissions: ["create:content"]
}
```

### Request Flow with Multi-Tenancy

```
Request
  ↓
[TenantMiddleware] - Extract JWT, append orgId to request
  ↓
[JwtAuthGuard] - Validate token signature
  ↓
[TenantGuard] - Verify user belongs to requested org_id
  ↓
[PermissionGuard] - Check user has required permissions
  ↓
[Controller] - Handle with org context already set
  ↓
[Service] - All queries filtered by orgId
  ↓
[Prisma] - Executes with organizational scope
  ↓
Response (only user's org data)
```

## Security Architecture

### Authentication Flow

```
1. User Registration
   Email + Password + Name
        ↓
   Bcrypt Hash (10 rounds)
        ↓
   Create User + Organization
        ↓
   Issue JWT + Refresh Token
        ↓
   Return Tokens

2. User Login
   Email + Password
        ↓
   Hash & Compare
        ↓
   Generate JWT (15m)
        ↓
   Generate Refresh Token (7d)
        ↓
   Return Tokens

3. Token Refresh
   Refresh Token (valid)
        ↓
   Verify Signature
        ↓
   Generate new JWT
        ↓
   Return New Access Token
```

### Permission Matrix

```
┌──────────────┬────────┬─────────┬─────────────┬─────────┐
│ Resource     │ Admin  │ Manager │ Creator     │ Viewer  │
├──────────────┼────────┼─────────┼─────────────┼─────────┤
│ Content      │ CRUD   │ CRUD    │ Own-CRUD    │ R       │
│ Users        │ CRUD   │ R       │ -           │ -       │
│ Organization │ RU     │ R       │ -           │ -       │
│ Billing      │ CRUD   │ -       │ -           │ -       │
│ Analytics    │ R      │ R       │ R (own only)│ -       │
└──────────────┴────────┴─────────┴─────────────┴─────────┘

Legend: C=Create, R=Read, U=Update, D=Delete, -=None
```

## Service Layer Architecture

### Authentication Service

```typescript
register(email, password) → User + Organization
login(email, password) → JWT + RefreshToken
refreshToken(token) → JWT
validateToken(token) → JwtPayload
```

### Organization Service

```typescript
createOrganization(userId, name) → Organization
getOrganization(orgId, userId) → Organization
updateOrganization(orgId, userId, data) → Organization
inviteMember(orgId, userId, email) → Invitation
acceptInvitation(token, userId) → Membership
```

### Users Service

```typescript
getUserProfile(userId) → User
updateUserProfile(userId, data) → User
listMembers(orgId, userId) → Members[]
removeOrganizationMember(orgId, userId) → void
```

### RBAC Service

```typescript
getOrganizationRoles(orgId) → Role[]
createRole(orgId, userId, name) → Role
addPermission(roleId, action, resource) → Permission
removePermission(permissionId) → void
hasPermission(userId, orgId, action, resource) → boolean
```

### Content Service

```typescript
createContent(orgId, userId, dto) → Content
getContent(contentId, orgId) → Content
listContent(orgId, userId, filters) → Content[]
updateContent(contentId, orgId, userId, dto) → Content
deleteContent(contentId, orgId, userId) → void
publishContent(contentId, orgId, userId) → Content
scheduleContent(contentId, orgId, userId, date) → Content
```

## Database Design

### Schema Relationships

```
User
  ├─ organizationMembers (1:*)
  ├─ apiKeys (1:*)
  ├─ contentCreated (1:*)
  └─ sessions (1:*)

Organization
  ├─ members (1:*)
  ├─ roles (1:*)
  ├─ content (1:*)
  ├─ workflows (1:*)
  ├─ subscriptions (1:*)
  ├─ billingProfiles (1:*)
  ├─ webhooks (1:*)
  └─ analyticsEvents (1:*)

OrganizationMember
  ├─ user (*/1)
  ├─ organization (*/1)
  └─ role (*/1)

Role
  ├─ permissions (1:*)
  ├─ members (1:*)
  └─ invitations (1:*)

Permission
  └─ role (*/1)

Content
  ├─ creator (*/1 User)
  ├─ organization (*/1)
  ├─ media (1:*)
  ├─ workflow (1:1)
  └─ analyticsEvents (1:*)

Media
  └─ content (*/1)

Subscription
  ├─ organization (*/1)
  ├─ plan (*/1)
  └─ invoices (1:*)

Workflow
  ├─ organization (*/1)
  ├─ content (1:1)
  └─ actions (1:*)

AuditLog
  ├─ organization (*/1)
  ├─ user (*/1)

AnalyticsEvent
  ├─ organization (*/1)
  ├─ content (*/1)
```

## Error Handling Strategy

### Error Hierarchy

```
ApplicationError (Base)
  ├─ AuthenticationError (401)
  │   └─ InvalidCredentialsError
  │   └─ ExpiredTokenError
  │   └─ InvalidTokenError
  │
  ├─ AuthorizationError (403)
  │   └─ InsufficientPermissionsError
  │   └─ TenantAccessDeniedError
  │
  ├─ ValidationError (400)
  │   └─ InvalidInputError
  │   └─ DuplicateResourceError
  │
  ├─ NotFoundError (404)
  │   └─ ResourceNotFoundError
  │   └─ UserNotFoundError
  │
  └─ ServerError (500)
      └─ DatabaseError
      └─ ExternalServiceError
```

### Global Exception Filter

```typescript
catch(exception, host) {
  // Log error
  // Format response
  // Hide sensitive info in production
  // Return error response
}
```

## Scalability Considerations

### Database Scaling

```
Current:
Single PostgreSQL Instance
  └─ Read replicas for analytics

Future:
Primary: Write operations
  ├─ Read Replica 1: Analytics queries
  ├─ Read Replica 2: User queries
  └─ Read Replica 3: Backup
```

### Caching Strategy

```
Session Layer (Redis)
  └─ JWT validation results
  └─ User permissions
  └─ Organization data

Object Cache (Redis)
  └─ Recent content
  └─ Billing plans
  └─ Feature flags

Search Cache (Meilisearch)
  └─ Full-text search results
  └─ Auto-complete data
```

### Job Queue Strategy

```
Background Jobs (BullMQ)
  ├─ Video encoding
  ├─ Email sending
  ├─ Content scheduling
  ├─ Report generation
  ├─ Webhook delivery
  └─ Analytics aggregation

Priorities:
  Email notifications: High
  Video encoding: Medium
  Report generation: Low
  Cleanup tasks: Very Low
```

## API Versioning

```
/api/v1/...  (Current)
/api/v2/...  (Future)

Version in URL allows:
- Maintaining backward compatibility
- Gradual migration
- Feature flags per version
```

## Monitoring & Logging

### Structured Logging

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "service": "auth-service",
  "requestId": "req-123",
  "userId": "user-456",
  "organizationId": "org-789",
  "action": "user-login",
  "status": "success",
  "duration": 123
}
```

### Key Metrics

- Request latency (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- Cache hit ratio
- Queue depth
- Authentication failures
- Permission denials
- Cost per API call

## Deployment Strategy

### Blue-Green Deployment

```
Current (Blue)
  └─ 50% traffic

New Version (Green)
  └─ 50% traffic

Monitor metrics...

Cutover (Green becomes Blue)
  └─ 100% traffic

Rollback capability ready
```

## Compliance & Audit

### Audit Logging

```
Every sensitive action logged:
- User creation/deletion
- Permission changes
- Password reset
- Billing updates
- Organization access changes

Auditable data:
- Who (user ID)
- What (action)
- When (timestamp)
- Where (IP address)
- Result (success/failure)
```

## Performance Optimization

### Query Optimization

```typescript
// Bad: N+1 query problem
const users = await Users.find();
for (let user of users) {
  user.org = await Org.findById(user.orgId);  // N queries
}

// Good: Single query with join
const users = await Users.find().include({ org: true });

// Index on foreign key
@@index([organizationId, userId])
```

### Connection Pooling

```
PostgreSQL Pool:
  └─ Min connections: 5
  └─ Max connections: 20
  └─ Idle timeout: 30s

Redis:
  └─ Connection pool
  └─ Auto-reconnect
  └─ Sentinel support
```

---

**Document Version**: 1.0.0
**Last Updated**: 2024-01-01
**Status**: Production Ready (Phase 1)
