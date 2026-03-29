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

## Support

- Documentation: docs.belsuite.com
- Email: api-support@belsuite.com
- Status Page: status.belsuite.com
- Community Forum: community.belsuite.com

---

**API Version**: v1
**Last Updated**: 2024-01-01
**Status**: Production Ready
