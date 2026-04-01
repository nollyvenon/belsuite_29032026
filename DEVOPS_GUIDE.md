# 🚀 DevOps & Scaling System - Module 12

## Overview

Complete infrastructure-as-code setup for BelSuite with:
- Containerized services (Docker)
- CI/CD pipeline (GitHub Actions)
- Auto-scaling (Kubernetes + Docker Compose)
- Monitoring (Prometheus + Grafana)
- Centralized logging (ELK Stack)
- Multi-environment support

---

## Architecture

### Services

```
┌─────────────────────────────────────────────────┐
│         Nginx Reverse Proxy & Load Balancer     │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐             ┌──────▼──┐
    │Frontend│             │ Backend  │
    │ (Next) │             │(NestJS)  │
    └───┬────┘             └──────┬───┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼──┐    ┌────▼────┐  ┌───▼──┐
    │  DB  │    │  Redis  │  │Search│
    │(Pgsql)   │ (Cache)  │  │(ES)  │
    └──────┘    └─────────┘  └──────┘
```

### Monitoring Stack

```
Application Metrics
        ↓
    Prometheus
        ↓
    Grafana (Dashboards)
        ↓
    AlertManager → Slack/PagerDuty
```

### Logging Stack

```
Container Logs (Docker)
        ↓
    Logstash (Processing)
        ↓
    Elasticsearch (Storage)
        ↓
    Kibana (Visualization)
```

---

## 1️⃣ Dockerization

### Multi-Stage Build

**Dockerfile** (Backend):
- Builder stage: Compiles code, installs dependencies
- Runtime stage: Minimal image with only production artifacts
- Non-root user execution
- Health checks configured
- Proper signal handling with dumb-init

**Key Features:**
- ✅ Small image size (~150MB)
- ✅ No build tools in production
- ✅ Security hardened
- ✅ Health monitoring

### Container Registry

Store images in GitHub Container Registry (GHCR):

```bash
# Login
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

# Build & Push
docker build -t ghcr.io/belsuite/belsuite:backend-latest .
docker push ghcr.io/belsuite/belsuite:backend-latest
```

---

## 2️⃣ Docker Compose - Development vs Production

### Development Mode

```bash
# Uses .env file with default credentials
docker-compose up

# Services: PostgreSQL, Redis, Backend, Frontend, Meilisearch
```

### Production Mode

```bash
# Uses docker-compose.prod.yml with secure setup
docker-compose -f docker-compose.prod.yml up -d

# Services:
# - Frontend (Next.js)
# - Backend (NestJS)
# - PostgreSQL (with backups)
# - Redis (with auth)
# - Prometheus (metrics)
# - Grafana (dashboards)
# - Elasticsearch (logs)
# - Kibana (log viewer)
# - Logstash (log processing)
# - AlertManager (alerts)
# - Nginx (reverse proxy)
```

---

## 3️⃣ CI/CD Pipeline (GitHub Actions)

### Workflows

#### 1. Quality & Security (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to main, develop, release branches
- Pull requests

**Jobs:**

```
┌─────────────┐     ┌──────────┐
│   Linter    │ ──> │ Type Check│
└─────────────┘     └──────────┘
        ↓
    ┌───────────────────┐
    │ Security Scanning │ (Trivy, npm audit)
    └─────────────────┘
```

**Steps:**
1. Lint code (ESLint)
2. Type check (TypeScript)
3. Run security scans (Trivy)
4. Generate coverage

#### 2. Build Images

**Inputs:**
- Passes quality checks
- On main/develop/release branches

**Process:**
1. Setup Docker Buildx multi-architecture builder
2. Build backend image
3. Build frontend image
4. Push to GHCR with tags:
   - `latest` (for main)
   - Git SHA
   - Branch name
   - Version tags (semver)

**Caching:**
- Uses GitHub Actions cache
- Reduces build time by 60%

#### 3. Test Pipeline

**Unit Tests:**
```bash
npm run test:unit
```

**Integration Tests:**
```bash
DATABASE_URL=postgresql://postgres:test@localhost:5432/test_db npm run test:integration
```

**E2E Tests:**
```bash
docker-compose -f docker-compose.test.yml up
npm run test:e2e
```

**Coverage:**
- Uploaded to Codecov
- Tracks coverage trends

#### 4. Staging Deployment

**Trigger:** Push to `develop` branch

**Steps:**
1. Build & push images
2. SSH to staging server
3. Pull latest images
4. Restart services: `docker-compose up -d`
5. Run migrations: `npm run prisma:migrate`

#### 5. Production Deployment

**Trigger:** Push to `main` branch

**Process:**
1. Build & push images
2. Request manual approval (GitHub Environments)
3. Backup database: `pg_dump | gzip`
4. Deploy with blue-green strategy
5. Wait 30s, run health checks
6. Notify Slack on success/failure

**Safety:**
- Automatic rollback on failed health check
- Manual approval required
- Database backup before deploy
- Slack notifications

#### 6. Performance Testing

**Trigger:** After staging deployment

**Tools:** k6 load testing

```javascript
// tests/k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;

export const options = {
  vus: 100,           // 100 concurrent users
  duration: '30s',    // Run for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

---

## 4️⃣ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
# Configure kubeconfig
export KUBECONFIG=~/.kube/config

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### Deployment

```bash
# 1. Apply namespace & configs
kubectl apply -f k8s/deployment.yml

# 2. Apply monitoring
kubectl apply -f k8s/networking-monitoring.yml

# 3. Verify
kubectl get pods -n belsuite-prod
kubectl get svc -n belsuite-prod
```

### Key Features

#### Auto Scaling (HPA)

**Backend:**
- Min replicas: 3 (high availability)
- Max replicas: 10 (cost control)
- Triggers:
  - CPU > 70%
  - Memory > 80%
  - HTTP requests > 1k req/s

**Frontend:**
- Min replicas: 2
- Max replicas: 5
- Triggers: CPU > 75%

**Example HPA Manifest:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: belsuite-backend-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: belsuite-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
```

#### Rolling Updates

- Max surge: 1 (add 1 new replica at a time)
- Max unavailable: 0 (never remove all replicas)
- Ensures zero-downtime deployments

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

#### Pod Disruption Budgets

Protects against accidental eviction:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: belsuite-backend-pdb
spec:
  minAvailable: 2  # Keep 2 pods running
  selector:
    matchLabels:
      app: belsuite-backend
```

#### Resource Quotas & Limits

**Namespace Quota:**
- CPU: 20 requests, 40 limits
- Memory: 40Gi requests, 80Gi limits
- Max pods: 100

**Per Container Limits:**
- Min: 100m CPU, 128Mi memory
- Max: 2 CPU, 2Gi memory

#### Network Policies

- Backend only accepts traffic from frontend
- Metric scraping from specific namespaces
- Egress to databases and external APIs only

#### Ingress

```yaml
# HTTPS with auto-issuing certificates (Let's Encrypt)
apiVersion: networking.k8s.io/v1
kind: Ingress
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.belsuite.app
        - api.belsuite.app
      secretName: belsuite-tls
  rules:
    - host: app.belsuite.app
      http:
        paths:
          - path: /
            backend:
              service:
                name: belsuite-frontend
```

---

## 5️⃣ Monitoring (Prometheus + Grafana)

### Prometheus Configuration

**Scrape Targets:**
1. Backend (`/metrics` endpoint)
2. Node exporter (host metrics)
3. PostgreSQL exporter
4. Redis exporter
5. Nginx exporter
6. Elasticsearch

**Data Retention:** 90 days

**Scrape Interval:** 15s (30s for backend)

### Alert Rules

**Critical Alerts:**
- Backend down (immediate)
- Error rate > 5% (5m)
- Database unreachable (1m)
- Disk space < 10%

**High Alerts:**
- API latency P95 > 1s (5m)
- Memory usage > 85% (5m)
- Connection pool exhausted

**Medium Alerts:**
- Slow queries detected (5m)
- Redis memory usage > 85% (5m)

### Grafana Dashboards

**Pre-configured Dashboards:**

1. **Performance Dashboard**
   - Request rate (req/s)
   - Error rate (%)
   - P50, P95, P99 latencies
   - Throughput by endpoint

2. **Infrastructure Dashboard**
   - CPU/Memory usage
   - Disk I/O
   - Network traffic
   - Container status

3. **Database Dashboard**
   - Connections (active/idle)
   - Query performance
   - Cache hit ratio
   - Slow queries

4. **Business Metrics**
   - Active users
   - Transactions per minute
   - Revenue per minute
   - SLA compliance

### Alert Routing

```
Prometheus
    ↓
AlertManager
    ├─→ Critical: Slack #critical-alerts + PagerDuty
    ├─→ High: Slack #alerts
    ├─→ Database: Slack #database-alerts
    └─→ App: Slack #app-alerts
```

---

## 6️⃣ Centralized Logging (ELK Stack)

### Components

1. **Logstash** (Shipper)
   - Collects logs from Docker, applications, services
   - Parses JSON, Nginx, PostgreSQL, Redis logs
   - Adds metadata (environment, service, cluster)
   - Outputs to Elasticsearch

2. **Elasticsearch** (Storage)
   - Indexes logs for fast search
   - Retention: Configurable (default 30 days)
   - Separate indexes for app, errors, audit logs

3. **Kibana** (Visualization)
   - Log exploration UI
   - Create visualizations & dashboards
   - Alerting on log patterns

### Log Parsing

**JSON Application Logs:**
```json
{
  "timestamp": "2026-04-01T10:00:00Z",
  "level": "info",
  "message": "User created",
  "userId": "user_123",
  "duration": 45
}
```

**Nginx Access Logs:**
```
192.168.1.1 - - [01/Apr/2026:10:00:00 +0000] "GET /api/health HTTP/1.1" 200 50
```

**PostgreSQL Logs:**
```
2026-04-01 10:00:00 UTC [pid] LOG: connection authorized: user=belsuite
```

### Log Index Strategy

```
belsuite-2026.04.01          # All logs
belsuite-errors-2026.04.01   # High-severity logs
belsuite-audit-2026.04.01    # User actions
```

### Sample Queries

```sql
-- Find error logs
{
  "query": {
    "match": {
      "level": "error"
    }
  }
}

-- Find slow queries
{
  "query": {
    "bool": {
      "must": [
        { "match": { "tags": "postgres" } },
        { "range": { "duration": { "gte": 1000 } } }
      ]
    }
  }
}

-- Find user activity
{
  "query": {
    "match": {
      "userId": "user_123"
    }
  }
}
```

---

## 7️⃣ Environment Setup

### Production Server

**Requirements:**
- Ubuntu 22.04 LTS
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 100GB disk

**Setup:**

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Create app directory
sudo mkdir -p /app/belsuite
sudo chown $USER:$USER /app/belsuite

# 5. Clone repository
cd /app/belsuite
git clone https://github.com/belsuite/belsuite.git .

# 6. Setup environment
cp .env.example .env
# Edit .env with production values

# 7. Setup SSL certificates
# Option A: Use Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# 8. Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

**Critical Secrets:**

```bash
# Database
DB_PASSWORD=<strong-random-password>

# Redis
REDIS_PASSWORD=<strong-random-password>

# JWT
JWT_SECRET=<32-char-random-string>

# API Keys
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG....
OPENAI_API_KEY=sk-...

# Monitoring
GRAFANA_PASSWORD=<strong-password>
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_SERVICE_KEY=...

# Deployment
GITHUB_TOKEN=ghp_...
EMAIL_ALERTS=ops@belsuite.app
```

**File: `.env.prod`**

```bash
# Application
NODE_ENV=production
API_URL=https://api.belsuite.app
FRONTEND_URL=https://app.belsuite.app

# Database
DATABASE_URL=postgresql://belsuite:${DB_PASSWORD}@postgres:5432/belsuite
DB_BACKUP_RETENTION=7

# Caching
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENV=production
LOG_CLUSTER=primary

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Scaling
MIN_INSTANCES=3
MAX_INSTANCES=10
CPU_THRESHOLD=70
MEMORY_THRESHOLD=80
```

---

## 8️⃣ Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and tested
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] SSL certificates issued
- [ ] Backups automated
- [ ] Monitoring alerting configured
- [ ] Runbooks created for common failures
- [ ] Team notified of deployment window

### Deployment

- [ ] Create database backup
- [ ] Pull latest images
- [ ] Run database migrations
- [ ] Start new services
- [ ] Verify health checks pass
- [ ] Run smoke tests
- [ ] Monitor error rates for 5 minutes
- [ ] Roll forward or rollback as needed

### Post-Deployment

- [ ] Verify all endpoints responding
- [ ] Check monitoring dashboards
- [ ] Review logs for errors
- [ ] Validate database integrity
- [ ] Update deployment status page
- [ ] Send notification to team

---

## 9️⃣ Scaling Strategies

### Vertical Scaling

1. **Increase container resources:**
   ```yaml
   resources:
     requests:
       memory: '1Gi'
       cpu: '1000m'
   ```

2. **Larger database instances**
3. **More Redis memory**

### Horizontal Scaling

1. **Kubernetes HPA** (preferred)
   - Auto-scales based on metrics
   - No manual intervention

2. **Docker Compose**
   - Manual: `docker-compose up --scale backend=5`
   - Nginx balances traffic

### Database Scaling

1. **Read Replicas**
   ```sql
   -- Create replica (async)
   CREATE PUBLICATION pub_all FOR ALL TABLES;
   ```

2. **Connection Pooling**
   - PgBouncer configuration
   - Max connections: 200 per replica

3. **Caching Strategy**
   - Redis for frequently accessed data
   - TTL: 1 hour for user data

---

## 🔟 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs backend
# Check: PORT conflicts, environment variables, volumes
```

**High memory usage:**
```bash
docker stats
# Find largest container, check for memory leaks
```

**Database connectivity:**
```bash
docker-compose exec backend npm run db:check-connection
```

**Metric collection failing:**
```
Prometheus UI: http://localhost:9090
Status → Targets → Check backend status
```

---

## 📚 References

- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs
- Prometheus: https://prometheus.io/docs
- Grafana: https://grafana.com/docs
- Elasticsearch: https://www.elastic.co/guide/en/elasticsearch
- GitHub Actions: https://docs.github.com/en/actions

---

## 📝 Support

For questions, contact: devops@belsuite.app
