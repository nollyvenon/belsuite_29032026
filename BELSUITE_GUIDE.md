# Belsuite - Production-Ready Multi-Tenant SaaS Platform

**Belsuite** is a comprehensive, enterprise-grade, multi-tenant SaaS platform combining content creation, video editing, marketing automation, scheduling, UGC creation, AI ad generation, and analytics. Built with production-ready architecture designed to scale to 10M+ users.

## 🏗️ System Architecture

### Core Philosophy
- **Multi-Tenancy**: Complete tenant isolation at data, cache, and file storage levels
- **Modular Design**: Clear service boundaries with minimal coupling (ready for microservices)
- **Security First**: Defense-in-depth approach with encryption, RBAC, and audit logging
- **Scalability**: Designed for horizontal scaling from day one
- **API-First**: Complete REST API with webhook support

### Technology Stack

**Frontend:**
- Next.js 16 + React 19 (Web)
- React Native (Mobile - future)
- Electron (Desktop - future)

**Backend:**
- Node.js + NestJS (modular, TypeScript-first)
- Express (HTTP server)
- Passport.js (authentication)

**Database & Cache:**
- PostgreSQL 15+ (primary data store)
- Redis (caching, sessions, job queue)
- Meilisearch (full-text search)

**Storage & Messaging:**
- AWS S3 (media, exports)
- BullMQ + Redis (job queue)
- Webhook support (for integrations)

**AI & Services:**
- OpenAI API (content generation)
- Stripe (payments)
- SendGrid (email)

## 📁 Project Structure

```
BelSuite/
├── src/
│   ├── backend/              # NestJS Backend
│   │   ├── auth/             # JWT, OAuth, sessions
│   │   ├── users/            # User management
│   │   ├── organizations/    # Multi-tenancy & workspaces
│   │   ├── rbac/             # Role-based access control
│   │   ├── content/          # Content CRUD operations
│   │   ├── subscriptions/    # Billing engine
│   │   ├── automation/       # Workflow automation
│   │   ├── analytics/        # Event tracking
│   │   ├── ai/               # AI service abstraction
│   │   ├── storage/          # S3 integration
│   │   ├── common/           # Shared guards, decorators, filters
│   │   ├── config/           # Configuration management
│   │   ├── database/         # Prisma setup
│   │   └── main.ts           # Application bootstrap
│   │
│   ├── app/                  # Next.js Frontend
│   │   ├── page.tsx          # Landing page
│   │   ├── demo/             # Demo interface
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   │
│   └── components/           # Reusable components
│
├── prisma/                   # Database schema & migrations
│   └── schema.prisma         # Multi-tenant schema
│
├── docker-compose.yml        # Local dev environment
├── Dockerfile                # Production image
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+
- npm 9.0+
- Docker & Docker Compose (optional, for local dev)
- PostgreSQL 15+ (or use Docker)
- Redis (or use Docker)

### Local Development

1. **Clone & Install**
```bash
git clone <repository>
cd BelSuite
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# View database via Prisma Studio
npm run db:studio
```

4. **Start Services (Option A: Docker)**
```bash
docker-compose up -d
```

5. **Start Services (Option B: Manual)**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Database Studio: `npm run db:studio`

## 🔐 Authentication & Multi-Tenancy

### Authentication Flow

1. **Registration** (`POST /api/auth/register`)
   - User signs up with email, password, name
   - Automatic organization creation
   - Admin role assigned
   - Default permissions granted

2. **Login** (`POST /api/auth/login`)
   - Email + password authentication
   - JWT token generation (15m expiration)
   - Refresh token issued (7d expiration)
   - User org context included in JWT

3. **Token Validation**
   - Every request validated via `JwtAuthGuard`
   - Tenant ID extracted from JWT
   - Request scoped to user's organization

### Multi-Tenancy Architecture

**Row-Level Isolation:**
```prisma
model Content {
  id              String    @id
  organizationId  String    // REQUIRED: All content tied to org
  creatorId       String
  // ...
  @@index([organizationId])  // Every query filtered by org_id
}
```

**Request Isolation:**
```typescript
@UseGuards(JwtAuthGuard)
@Controller('api/content')
export class ContentController {
  @Get()
  async list(@Tenant() organizationId: string) {
    // organizationId automatically extracted from JWT
    // All queries filtered by this org
  }
}
```

**Multi-Layer Protection:**
- Row-level filtering in Prisma queries
- JWT claims include `orgId`
- `TenantGuard` validates org ownership
- S3 files namespaced by `org_id`
- Redis keys prefixed with `org:{id}:`

## 👥 Role-Based Access Control (RBAC)

### Default Roles

**Admin** (System Role)
- Full organization access
- User & role management
- Billing & subscription control
- Feature access management

**Manager** (Custom Role)
- Content moderation
- User management
- Workflow management
- Analytics access

**Creator** (Custom Role)
- Create/edit content
- View analytics
- Schedule content
- Manage own interactions

**Viewer** (Custom Role)
- View-only access
- No create/edit permissions

### Permission System

Permissions follow `action:resource` pattern:
```
create:content    - Create content
read:content      - View content
update:content    - Edit content
delete:content    - Remove content

manage:users      - User management
manage:billing    - Subscription changes
manage:organization - Org settings
```

### Permission Guard Example

```typescript
@Post('content')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('create:content')
async create(@Body() createDto: CreateContentDto) {
  // Only users with "create:content" permission allowed
}
```

## 💳 Subscription & Billing

### Billing Plans

| Plan | Price/mo | Members | Storage | Features |
|------|---------|---------|---------|----------|
| **Free** | $0 | 5 | 5GB | Basic content |
| **Starter** | $29 | 10 | 100GB | + Automation |
| **Professional** | $99 | 50 | 1TB | + Analytics |
| **Enterprise** | Custom | Unlimited | Unlimited | + API Support |

### Subscription Flow

1. User selects plan
2. Redirects to Stripe checkout
3. Payment processed
4. Webhook triggers
5. Subscription activated
6. Features unlocked

## 📊 Database Schema Highlights

### Core Tables
- **users** - User accounts
- **organizations** - Workspaces
- **organization_members** - User-Org relationships
- **roles** - Permission groups
- **subscriptions** - Billing records
- **content** - User-created content
- **workflows** - Automation sequences
- **audit_logs** - Compliance & security

### Key Relationships
```prisma
User 1--* OrganizationMember
Organization 1--* OrganizationMember
Role 1--* Permission
Organization 1--* Role
Content "created by" User
Content "belongs to" Organization
```

## 🔌 API Endpoints (Phase 1)

### Authentication
```
POST   /api/v1/auth/register               Register new user
POST   /api/v1/auth/login                  Login with credentials
POST   /api/v1/auth/refresh                Refresh access token
POST   /api/v1/auth/logout                 Invalidate session
GET    /api/v1/auth/me                     Current user profile
```

### Users
```
GET    /api/v1/users/me                    User profile
PUT    /api/v1/users/me                    Update profile
GET    /api/v1/users/organizations         List user's organizations
```

### Organizations
```
POST   /api/v1/organizations               Create organization
GET    /api/v1/organizations/:id           Get org details
PUT    /api/v1/organizations/:id           Update org
POST   /api/v1/organizations/:id/members   Invite member
GET    /api/v1/organizations/:id/members   List members
PUT    /api/v1/organizations/:id/members/:userId/role   Change role
DELETE /api/v1/organizations/:id/members/:userId        Remove member
```

### Content
```
POST   /api/v1/content                     Create content
GET    /api/v1/content                     List content (paginated)
GET    /api/v1/content/:id                 Get content details
PUT    /api/v1/content/:id                 Update content
DELETE /api/v1/content/:id                 Delete content
POST   /api/v1/content/:id/publish         Publish content
POST   /api/v1/content/:id/schedule        Schedule publication
```

### Subscriptions
```
GET    /api/v1/subscriptions/plans         List billing plans
GET    /api/v1/organizations/:id/subscription    Get subscription
POST   /api/v1/organizations/:id/subscription    Create subscription
POST   /api/v1/organizations/:id/subscription/cancel   Cancel
GET    /api/v1/organizations/:id/invoices Get invoices
```

## 🏗️ Implementation Phases

### Phase 1: ✅ CORE (Current)
- [x] User authentication (JWT)
- [x] Multi-tenancy infrastructure
- [x] Role-based access control
- [x] Organization management
- [x] User management
- [x] Database schema design
- [x] API Error handling
- [x] Request validation

### Phase 2: Business (In Progress)
- [ ] Stripe integration (Subscriptions)
- [ ] Email service (SendGrid)
- [ ] Webhook system
- [ ] API keys management
- [ ] Audit logging

### Phase 3: Content
- [ ] Content CRUD (full implementation)
- [ ] Media upload to S3
- [ ] Image optimization
- [ ] Video processing (BullMQ jobs)
- [ ] CDN integration

### Phase 4: Automation
- [ ] Workflow builder
- [ ] Content scheduling
- [ ] Social media publishing
- [ ] Template engine

### Phase 5: Analytics
- [ ] Event tracking
- [ ] Dashboard analytics
- [ ] Real-time insights
- [ ] Report generation

### Phase 6: AI
- [ ] Content generation API
- [ ] Image generation
- [ ] Video summarization
- [ ] Ad optimization

## 🔒 Security Implemented

✅ **Authentication**
- JWT with short expiration + refresh tokens
- Bcrypt password hashing (10 rounds)
- Secure session management

✅ **Authorization**
- Role-based access control
- Permission-based guards
- Organization isolation

✅ **Data Protection**
- SQL injection protection (Prisma ORM)
- Input validation (class-validator)
- CORS configured
- CSRF protection ready
- Helmet security headers

✅ **Audit & Compliance**
- Audit log recording
- User action tracking
- Soft deletes support
- Data retention policies

## 📈 Scalability Features

- **Database**: Read replicas for analytics
- **Caching**: Redis for sessions and data caching
- **File Storage**: S3 for distributed media
- **Job Queue**: BullMQ for background tasks
- **Horizontal Scaling**: Stateless API design
- **Load Balancing**: Ready for Nginx/HAProxy
- **Monitoring**: Structured logging support

## 🛠️ Development

### Build & Deploy

```bash
# Build
npm run build

# Production
npm run start:prod

# Docker
docker build -t belsuite:latest .
docker run -p 3001:3001 belsuite:latest
```

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

## 📚 Documentation

- **API Docs**: http://localhost:3001/api/docs (Swagger)
- **Database**: Run `npm run db:studio` for Prisma Studio
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🚢 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure PostgreSQL with backups
- [ ] Set up Redis replication
- [ ] Enable HTTPS/TLS
- [ ] Configure CDN for static files
- [ ] Set up monitoring & logging
- [ ] Enable database encryption
- [ ] Configure Stripe webhooks
- [ ] Set up email service
- [ ] Configure S3 access policies

### Deployment Options

**AWS:**
- ECS/Fargate for API
- RDS for PostgreSQL
- ElastiCache for Redis
- S3 for storage

**DigitalOcean:**
- App Platform
- Managed Databases
- S3-compatible Spaces

**Heroku:**
- Dyno for API
- Heroku Postgres
- Heroku Redis

## 📝 Environment Variables

See [.env.example](./.env.example) for all configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing secret (min 32 chars)
- `STRIPE_API_KEY` - Stripe API key
- `OPENAI_API_KEY` - OpenAI API key
- `AWS_S3_BUCKET` - S3 bucket name

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

- Issues: GitHub Issues
- Email: support@belsuite.com
- Docs: https://docs.belsuite.com

## 🎯 Roadmap

- Q1: Phase 2 (Billing & Webhooks)
- Q2: Phase 3 (Content Management)
- Q3: Phase 4 (Automation)
- Q4: Phase 5 (Analytics & AI)

---

Built with ❤️ by the Belsuite Team
