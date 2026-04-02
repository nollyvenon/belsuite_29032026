# Belsuite API Documentation

Complete REST API documentation for Belsuite platform.

## Base URL

```
Development: http://localhost:3001
Production: https://api.belsuite.com
```

## Authentication

All endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Get JWT Token

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## API Endpoints

### Authentication

#### Register New User

**POST /api/v1/auth/register**

Create new user account and organization.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "user-123",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Status Codes:**
- 201: User created successfully
- 400: Invalid input or email already registered
- 422: Validation error

---

####  Login

**POST /api/v1/auth/login**

Authenticate user and retrieve JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {...}
}
```

---

#### Refresh Token

**POST /api/v1/auth/refresh**

Get new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "long-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-access-token"
}
```

---

#### Get Current User

**GET /api/v1/auth/me**

Requires: `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "orgId": "org-456",
  "permissions": ["create:content", "read:content"]
}
```

---

### Users

#### Get User Profile

**GET /api/v1/users/me**

Requires: Authentication

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://s3.amazonaws.com/...",
  "timezone": "UTC",
  "preferredLanguage": "en",
  "lastLogin": "2024-01-01T12:00:00Z",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

#### Update User Profile

**PUT /api/v1/users/me**

Requires: Authentication

**Request:**
```json
{
  "firstName": "Jonathan",
  "timezone": "America/New_York",
  "preferredLanguage": "es"
}
```

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "Jonathan",
  "timezone": "America/New_York",
  "preferredLanguage": "es"
}
```

---

#### Get User Organizations

**GET /api/v1/users/organizations**

Requires: Authentication

**Response:**
```json
[
  {
    "organization": {
      "id": "org-123",
      "name": "My Company",
      "slug": "my-company",
      "logo": "https://s3.amazonaws.com/...",
      "tier": "PROFESSIONAL",
      "createdAt": "2024-01-01T10:00:00Z"
    },
    "role": "Admin",
    "joinedAt": "2024-01-01T10:00:00Z"
  }
]
```

---

### Organizations

#### Create Organization

**POST /api/v1/organizations**

Requires: Authentication

**Request:**
```json
{
  "name": "My New Company",
  "description": "Company description",
  "website": "https://example.com"
}
```

**Response:**
```json
{
  "id": "org-123",
  "name": "My New Company",
  "slug": "my-new-company",
  "description": "Company description",
  "website": "https://example.com",
  "status": "ACTIVE",
  "tier": "FREE",
  "maxMembers": 5,
  "maxProjects": 10,
  "maxStorageGB": 5,
  "usedStorageGB": 0,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

#### Get Organization

**GET /api/v1/organizations/:organizationId**

Requires: Membership in organization

**Response:**
```json
{
  "id": "org-123",
  "name": "My Company",
  "slug": "my-company",
  "description": "...",
  "logo": "...",
  "website": "...",
  "tier": "PROFESSIONAL",
  "maxMembers": 50,
  "maxProjects": 100,
  "maxStorageGB": 1024,
  "usedStorageGB": 256.5,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

#### Update Organization

**PUT /api/v1/organizations/:organizationId**

Requires: Admin role

**Request:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "website": "https://newsite.com",
  "logo": "https://s3.amazonaws.com/logo.png"
}
```

**Response:**
```json
{
  "id": "org-123",
  "name": "Updated Company Name",
  ...
}
```

---

#### List Organization Members

**GET /api/v1/organizations/:organizationId/members?page=1&limit=10**

Requires: Membership in organization

**Response:**
```json
{
  "data": [
    {
      "id": "member-123",
      "user": {
        "id": "user-456",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "...",
        "createdAt": "2024-01-01T10:00:00Z"
      },
      "role": {
        "id": "role-789",
        "name": "Admin"
      },
      "joinedAt": "2024-01-01T10:00:00Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

#### Invite Member

**POST /api/v1/organizations/:organizationId/invitations**

Requires: Admin role

**Request:**
```json
{
  "email": "newmember@example.com",
  "roleId": "role-123"
}
```

**Response:**
```json
{
  "invitationSent": true,
  "studentId": "invite-token-uuid"
}
```

---

#### Accept Invitation

**POST /api/v1/organizations/invitations/:token/accept**

Requires: Authentication

**Response:**
```json
{
  "id": "member-123",
  "organizationId": "org-456",
  "userId": "user-789",
  "roleId": "role-123",
  "status": "ACTIVE",
  "joinedAt": "2024-01-01T12:00:00Z"
}
```

---

#### Remove Member

**DELETE /api/v1/organizations/:organizationId/members/:userId**

Requires: Admin role

**Response:**
```json
{
  "success": true
}
```

**Status Code:** 204 No Content

---

### Content

#### Create Content

**POST /api/v1/content**

Requires: Authentication + `create:content` permission

**Request:**
```json
{
  "title": "Summer Campaign",
  "type": "IMAGE",
  "description": "Campaign imagery for summer 2024",
  "content": "Base64 encoded image data...",
  "thumbnail": "...",
  "tags": ["summer", "2024", "campaign"]
}
```

**Response:**
```json
{
  "id": "content-123",
  "organizationId": "org-456",
  "type": "IMAGE",
  "title": "Summer Campaign",
  "description": "Campaign imagery...",
  "creatorId": "user-789",
  "status": "DRAFT",
  "slug": "summer-campaign",
  "views": 0,
  "likes": 0,
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "publishedAt": null,
  "scheduledAt": null
}
```

---

#### List Content

**GET /api/v1/content?page=1&limit=10&status=DRAFT&type=IMAGE**

Requires: Authentication

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status (DRAFT, SCHEDULED, PUBLISHED)
- `type`: Filter by type (TEXT, IMAGE, VIDEO, CAROUSEL, etc.)

**Response:**
```json
{
  "data": [
    {
      "id": "content-123",
      "title": "Summer Campaign",
      "type": "IMAGE",
      "status": "DRAFT",
      "creator": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-01T12:00:00Z",
      "views": 0,
      "likes": 0
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

#### Get Content

**GET /api/v1/content/:contentId**

Requires: Authentication

**Response:**
```json
{
  "id": "content-123",
  "organizationId": "org-456",
  "type": "IMAGE",
  "title": "Summer Campaign",
  "description": "...",
  "slug": "summer-campaign",
  "content": "...",
  "creatorId": "user-789",
  "creator": {
    "id": "user-789",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "status": "DRAFT",
  "tags": ["summer", "2024"],
  "thumbnail": "...",
  "views": 0,
  "likes": 0,
  "media": [
    {
      "id": "media-123",
      "type": "IMAGE",
      "url": "https://s3.amazonaws.com/content-123/image-1.jpg",
      "fileName": "image-1.jpg",
      "fileSize": 1024000,
      "width": 1920,
      "height": 1080,
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "publishedAt": null,
  "scheduledAt": null
}
```

---

#### Update Content

**PUT /api/v1/content/:contentId**

Requires: Owner or Admin

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"]
}
```

**Response:**
```json
{
  "id": "content-123",
  "title": "Updated Title",
  ...
}
```

---

#### Delete Content

**DELETE /api/v1/content/:contentId**

Requires: Owner or Admin

**Response:**
```json
{
  "success": true
}
```

**Status Code:** 204 No Content

---

#### Publish Content

**POST /api/v1/content/:contentId/publish**

Requires: Owner or Admin

**Response:**
```json
{
  "id": "content-123",
  "status": "PUBLISHED",
  "publishedAt": "2024-01-01T12:00:00Z",
  ...
}
```

---

#### Schedule Content

**POST /api/v1/content/:contentId/schedule**

Requires: Owner or Admin

**Request:**
```json
{
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "content-123",
  "status": "SCHEDULED",
  "scheduledAt": "2024-01-15T10:00:00Z",
  ...
}
```

---

### Subscriptions

#### Get Billing Plans

**GET /api/v1/subscriptions/plans**

Requires: Authentication

**Response:**
```json
[
  {
    "id": "plan-free",
    "name": "Free",
    "tier": "FREE",
    "description": "Perfect for getting started",
    "pricePerMonth": 0,
    "pricePerYear": 0,
    "maxMembers": 5,
    "maxProjects": 10,
    "maxStorageGB": 5,
    "features": ["basic-content", "limited-automation"]
  },
  {
    "id": "plan-pro",
    "name": "Professional",
    "tier": "PROFESSIONAL",
    "description": "For growing teams",
    "pricePerMonth": 99,
    "pricePerYear": 990,
    "maxMembers": 50,
    "maxProjects": 100,
    "maxStorageGB": 1024,
    "features": ["all-features", "advanced-automation", "api-access"]
  }
]
```

---

#### Get Organization Subscription

**GET /api/v1/organizations/:organizationId/subscription**

Requires: Membership in organization

**Response:**
```json
{
  "id": "sub-123",
  "organizationId": "org-456",
  "plan": {
    "id": "plan-pro",
    "name": "Professional",
    "tier": "PROFESSIONAL"
  },
  "status": "ACTIVE",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelledAt": null,
  "invoices": [
    {
      "id": "invoice-123",
      "amount": 99,
      "currency": "USD",
      "status": "PAID",
      "issuedAt": "2024-01-01T00:00:00Z",
      "dueAt": "2024-01-15T00:00:00Z",
      "paidAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/v1/content",
  "method": "POST",
  "message": "Invalid input provided",
  "stack": "... (only in development)"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

Global rate limit: 100 requests per 15 minutes per IP

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704114000
```

---

## Pagination

All list endpoints support pagination:

```
GET /api/v1/content?page=2&limit=20
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 2,
    "limit": 20,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

---

## Webhooks

### Register Webhook

**POST /api/v1/webhooks**

```json
{
  "url": "https://example.com/webhook",
  "events": ["content.created", "content.published"]
}
```

### Webhook Events

- `content.created` - New content created
- `content.updated` - Content updated
- `content.published` - Content published
- `content.deleted` - Content deleted
- `user.created` - User added to org
- `user.removed` - User removed from org
- `subscription.updated` - Subscription changed

---

## SDKs

Official SDKs coming soon:
- JavaScript/TypeScript
- Python
- Go
- Ruby

---

## Module 5 — AI Calling & Voice Agents

Base path: `/api/ai-calling`

All routes require `Authorization: Bearer <jwt>` except the Twilio webhook callbacks which are public but Twilio-signature-protected.

---

### Voice Agents

#### Create Voice Agent

**POST /api/ai-calling/agents**

Create a reusable AI calling persona with objection playbooks, qualification questions, and a conversation style.

**Request:**
```json
{
  "name": "BelSuite Outbound SDR",
  "objective": "book_appointments",
  "industry": "SaaS",
  "style": "consultative",
  "objectionPlaybook": [
    "Not interested right now",
    "Send me details by email",
    "We already have a vendor"
  ],
  "qualificationQuestions": [
    "What growth target matters most this quarter?",
    "Do you have a dedicated operator for outbound?"
  ],
  "memoryConfig": { "retainTurns": 24 }
}
```

**Response:**
```json
{
  "id": "evt_abc123",
  "name": "BelSuite Outbound SDR",
  "objective": "book_appointments",
  "industry": "SaaS",
  "style": "consultative",
  "objectionPlaybook": ["Not interested right now"],
  "qualificationQuestions": ["What growth target matters most this quarter?"],
  "createdAt": "2026-04-01T12:00:00.000Z"
}
```

**Status Codes:**
- 201: Agent created
- 400: Validation error

---

#### List Voice Agents

**GET /api/ai-calling/agents**

Return all voice agents for the tenant.

**Response:** Array of voice agent objects (same shape as create response).

---

### Calls

#### Start AI Call

**POST /api/ai-calling/calls/start**

Queue an outbound call via Twilio Voice. An AI-generated opening script is produced before the call is dispatched to the BullMQ worker.

**Request:**
```json
{
  "voiceAgentId": "evt_abc123",
  "lead": {
    "fullName": "Jane Smith",
    "companyName": "Acme Corp",
    "phone": "+12025551234",
    "timezone": "America/New_York"
  },
  "campaignId": "camp_xyz",
  "objective": "book a growth strategy call"
}
```

**Response:**
```json
{
  "callId": "evt_call456",
  "status": "queued",
  "openingScript": "Hi Jane, this is BelSuite..."
}
```

**Status Codes:**
- 201: Call queued
- 404: Voice agent not found

---

#### List Calls

**GET /api/ai-calling/calls**

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20, max 200) |
| `status` | string | Filter by `queued` / `in_progress` / `completed` / `failed` / `booked` |
| `q` | string | Full-text search across call payload |

**Response:**
```json
{
  "items": [...],
  "page": 1,
  "limit": 20,
  "total": 47
}
```

---

#### Get Call Detail

**GET /api/ai-calling/calls/:callId**

Returns the call record plus the full conversation memory (up to last 24 turns).

---

#### Submit Conversation Turn

**POST /api/ai-calling/calls/:callId/turn**

Feed a customer speech transcript into the AI agent, receive AI reply and lead qualification score.

**Request:**
```json
{
  "transcript": "Pricing is our main concern right now.",
  "intentHint": "pricing_objection"
}
```

**Response:**
```json
{
  "callId": "evt_call456",
  "agentReply": "That makes sense — a lot of teams feel that way. The good news is most see ROI within the first 60 days. What growth target are you working toward this quarter?",
  "qualification": {
    "score": 72,
    "intent": "high",
    "budgetSignal": "concerned",
    "timelineSignal": "unknown",
    "authoritySignal": "likely",
    "summary": "Pricing objection raised but intent is high. Pursue appointment."
  }
}
```

---

#### Book Appointment

**POST /api/ai-calling/calls/book-appointment**

**Request:**
```json
{
  "callId": "evt_call456",
  "appointmentAt": "2026-04-03T14:00:00.000Z",
  "timezone": "America/New_York",
  "notes": "Interested in growth automation package"
}
```

**Response:**
```json
{
  "callId": "evt_call456",
  "status": "booked",
  "appointmentAt": "2026-04-03T14:00:00.000Z",
  "timezone": "America/New_York"
}
```

---

### Stats

#### Get Calling Stats

**GET /api/ai-calling/stats**

**Query params:** `days` (number, default 30)

**Response:**
```json
{
  "periodDays": 30,
  "totals": {
    "calls": 142,
    "booked": 31,
    "bookingRate": 21.83,
    "transcribed": 98
  },
  "byProviderStatus": [
    { "status": "completed", "count": 87 },
    { "status": "no-answer", "count": 34 },
    { "status": "busy", "count": 21 }
  ]
}
```

---

### Webhooks (Public — Twilio-signed)

These endpoints accept POST callbacks directly from Twilio. No JWT is required but every request is validated against the `TWILIO_AUTH_TOKEN` HMAC-SHA1 signature.

#### Voice Status Callback

**POST /api/ai-calling/webhooks/twilio/voice**

Receives Twilio `CallStatus`, `SpeechResult`, and `From` / `To` fields. If a `SpeechResult` is present, it is automatically piped into the conversation turn handler.

#### Recording Available Callback

**POST /api/ai-calling/webhooks/twilio/recording**

Receives `RecordingUrl`, `RecordingSid`, and duration. Automatically queues a Whisper transcription job.

**Both webhook responses return:**
```json
{
  "accepted": true,
  "matched": true,
  "callId": "evt_call456",
  "providerCallSid": "CA...",
  "signatureValid": true
}
```

---

### Event Types (Audit Log)

| Event | Description |
|-------|-------------|
| `ai.voice_agent.created` | Voice agent persona created |
| `ai.call.created` | Call record created and script generated |
| `ai.call.dispatched` | Call dispatched to Twilio |
| `ai.call.provider.status` | Twilio status callback received |
| `ai.call.turn.customer` | Customer speech stored |
| `ai.call.turn.agent` | AI agent reply stored |
| `ai.call.appointment.booked` | Appointment booked from call |
| `ai.call.recording.available` | Recording URL received from Twilio |
| `ai.call.recording.transcribed` | Whisper transcription completed |

---

## Support

- Documentation: docs.belsuite.com
- Email: api-support@belsuite.com
- Status Page: status.belsuite.com
- Community Forum: community.belsuite.com

---

## Module 9: AI Autopilot API

Base Path: `/api/ai-autopilot`

AI Autopilot is the orchestration layer that evaluates campaign/funnel/messaging performance and executes policy-driven optimization actions through an async queue.

### Create Autopilot Policy

`POST /api/ai-autopilot/policies`

Request:

```json
{
  "name": "Default Growth Brain",
  "description": "Pause weak campaigns and scale winners",
  "scope": "full_stack",
  "pauseRoiThreshold": 0,
  "scaleRoiThreshold": 30,
  "scaleBudgetPercent": 20,
  "autoRun": false,
  "runCron": "0 */6 * * *"
}
```

Response:

```json
{
  "id": "evt_abc123",
  "name": "Default Growth Brain",
  "scope": "full_stack",
  "pauseRoiThreshold": 0,
  "scaleRoiThreshold": 30,
  "scaleBudgetPercent": 20,
  "autoRun": false,
  "createdAt": "2026-04-02T10:00:00.000Z"
}
```

### List Autopilot Policies

`GET /api/ai-autopilot/policies`

Returns latest policy snapshots for the tenant.

### Trigger Autopilot Run

`POST /api/ai-autopilot/runs/trigger`

Request:

```json
{
  "policyId": "evt_abc123",
  "reason": "manual_dashboard_execution",
  "context": {
    "initiatedBy": "admin"
  }
}
```

Response:

```json
{
  "runId": "evt_run_123",
  "status": "queued"
}
```

### List Autopilot Runs

`GET /api/ai-autopilot/runs?page=1&limit=20&q=completed`

Returns requested/completed run events with action summaries.

### Get Autopilot Insights

`GET /api/ai-autopilot/insights?days=30`

Response includes:
- run totals
- active vs paused campaigns
- campaign ROI leaderboard
- AI synthesis: working/notWorking/recommendations

### Automation Actions Executed by Autopilot

Per run, AI Autopilot may execute:
- Pause active campaigns with ROI below `pauseRoiThreshold`
- Scale active campaigns with ROI at or above `scaleRoiThreshold`
- Emit funnel optimization suggestions from conversion signals
- Emit messaging experiment recommendations from outreach volume

All actions are persisted as analytics events for auditability.

---

**API Version**: v1
**Last Updated**: 2026-04-02
**Status**: Production Ready
