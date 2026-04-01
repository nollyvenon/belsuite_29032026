# 🚀 Module 12 DevOps & Scaling - Quick Start

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Internet Traffic                         │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTPS
          ┌───────────────▼────────────────┐
          │    Nginx Reverse Proxy         │
          │   (Load Balancer & SSL)         │
          └───────────────┬────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼───┐         ┌──▼───┐        ┌───▼──┐
    │Frontend├─────────┤Backend├────────┤ DB   │
    │(Next)  │         │(NestJS)       │(Psql)│
    └────────┘         └────────┘       └──────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            ┌───▼──┐             ┌──────▼───┐
            │Redis │             │ElasticSch│
            │Cache │             │  Logs    │
            └──────┘             └──────────┘

Monitoring ──┬─→ Prometheus ──┬─→ Grafana ──→ Dashboards
Alerts       │                 └─→ AlertManager ──→ Slack/PagerDuty
             └─→ Logstash ──→ Kibana → Search Logs
```

---

## 🎯 Deployment Paths

### Option 1: Docker Compose (Recommended for Small to Medium)

**Best for:** Single server deployments, staging environments

**Setup Time:** 15 minutes

```bash
# 1. Clone repository
git clone https://github.com/belsuite/belsuite.git
cd belsuite

# 2. Configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your values

# 3. Deploy
bash scripts/deploy.sh

# 4. Verify
docker-compose -f docker-compose.prod.yml ps
```

**Scaling:** Manual - `docker-compose up --scale backend=5`

**Cost:** ~$50-100/month (single server)

---

### Option 2: Kubernetes (Recommended for Large Scale)

**Best for:** Production with high availability requirements

**Setup Time:** 30-60 minutes

```bash
# 1. Provision cluster
# AWS EKS
eksctl create cluster --name belsuite --region us-east-1 --nodes=3

# Google GKE
gcloud container clusters create belsuite --num-nodes=3

# Azure AKS
az aks create --resource-group myResourceGroup --name belsuite --node-count 3

# 2. Configure kubectl
kubectl config use-context belsuite

# 3. Deploy BelSuite
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/networking-monitoring.yml

# 4. Verify
kubectl get pods -n belsuite-prod
kubectl get svc -n belsuite-prod
```

**Scaling:** Automatic via HPA

**Cost:** ~$200-500/month (3-node cluster)

---

## 📋 Pre-Deployment Checklist

- [ ] Domains configured (app.belsuite.app, api.belsuite.app)
- [ ] SSL certificates ready (or Let's Encrypt configured)
- [ ] Database backups configured
- [ ] Monitoring alerts configured
- [ ] Secrets stored securely (.env.prod not committed)
- [ ] Network firewall rules configured
- [ ] Log retention policy set
- [ ] Team access to monitoring dashboards

---

## 🔧 Configuration Management

### Environment Variables

**Critical Secrets (use secure vault):**
- `JWT_SECRET` - 32+ char random
- `DB_PASSWORD` - 32+ char random
- `REDIS_PASSWORD` - 32+ char random
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `SENDGRID_API_KEY` - From SendGrid dashboard
- `SLACK_WEBHOOK_URL` - From Slack workspace

**Example setup:**

```bash
# Method 1: Use AWS Secrets Manager
export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id belsuite/db_password --query SecretString --output text)

# Method 2: Use local .env file (commit to .gitignore)
source .env.prod

# Method 3: Use GitHub Secrets (for CI/CD)
# Settings → Secrets → Add Repository Secret
```

---

## 📊 Monitoring & Alerts

### Access Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://monitoring.belsuite.app | admin/PASSWORD |
| Kibana | https://logs.belsuite.app | elastic/PASSWORD |
| Prometheus | https://metrics.belsuite.app | None (read-only) |
| Alertmanager | https://alerts.belsuite.app | None (read-only) |

### Key Metrics to Monitor

```
Backend API:
- Error rate (target: < 0.5%)
- Latency P95 (target: < 1s)
- Requests per second
- Active database connections

Infrastructure:
- CPU usage (target: < 70%)
- Memory usage (target: < 80%)
- Disk usage (target: < 90%)
- Network I/O
```

### Alerts Configured

- ✅ Backend down (critical)
- ✅ High error rate (high)
- ✅ High latency (high)
- ✅ Database unreachable (critical)
- ✅ Redis down (critical)
- ✅ Disk space low (high)
- ✅ CPU/Memory high (warning)
- ✅ Elasticsearch down (high)

---

## 🔄 CI/CD Pipeline

### Trigger Events

1. **Pull Request** → Code quality checks
2. **Merge to develop** → Deploy to staging
3. **Merge to main** → Manual approval required → Deploy to production
4. **Tag (v*.*.*) ** → Auto-deploy to production

### Pipeline Stages

```
┌─────────────────┐
│ Code Push       │
└────────┬────────┘
         │
    ┌────▼──────────────────────┐
    │ 1. Lint & Type Check      │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 2. Security Scan (Trivy)  │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 3. Build Docker Images    │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 4. Unit & Integration Tests
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 5. E2E Tests              │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 6. Deploy to Staging      │ (develop only)
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 7. Performance Tests      │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 8. Manual Approval        │ (main only)
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 9. Deploy to Production   │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 10. Smoke Tests           │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ 11. Slack Notification    │
    └────────────────────────────┘
```

### View Pipeline Status

```bash
# GitHub Actions
open https://github.com/belsuite/belsuite/actions

# Recent deployments
gh run list --limit 5 --json status,conclusion,name,createdAt

# Logs for specific run
gh run view <RUN_ID> --log
```

---

## 🛠️ Common Operations

### Deployment

```bash
# Staging deployment (automatic on develop push)
git push origin develop

# Production deployment (requires approval)
git tag v1.0.0
git push origin v1.0.0

# Manual production deploy
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
```

### Scaling

```bash
# Docker Compose - Scale backend to 5 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=5

# Kubernetes - Scale backend to 5 instances
kubectl scale deployment belsuite-backend -n belsuite-prod --replicas=5

# Check HPA status
kubectl get hpa -n belsuite-prod -w
```

### Backup & Recovery

```bash
# Create database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U belsuite belsuite | gzip > backup-`date +%s`.sql.gz

# Restore from backup
gunzip < backup-1685000000.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U belsuite belsuite

# List backups
ls -lh backups/
```

### Logs & Troubleshooting

```bash
# View Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend

# Kubernetes logs
kubectl logs -n belsuite-prod deployment/belsuite-backend -f
kubectl logs -n belsuite-prod deployment/belsuite-backend --tail=50 --all-containers=true

# Search Elasticsearch logs
curl -X GET "elasticsearch:9200/belsuite-*/_search?q=level:error"

# Check service status
kubectl top nodes -n belsuite-prod
kubectl top pods -n belsuite-prod
```

### Health Checks

```bash
# API health
curl https://api.belsuite.app/api/health
# Response: { "status": "healthy" }

# Database connectivity
docker-compose -f docker-compose.prod.yml exec backend npm run db:check

# Redis connectivity
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Response: PONG

# All services
docker-compose -f docker-compose.prod.yml ps
```

---

## 🚨 Incident Response

### Backend Crashed

```bash
# 1. Check status
docker -compose -f docker-compose.prod.yml ps backend

# 2. View logs
docker-compose -f docker-compose.prod.yml logs backend --tail=100

# 3. Restart
docker-compose -f docker-compose.prod.yml restart backend

# 4. Monitor
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Database Connection Issues

```bash
# 1. Check PostgreSQL
docker-compose -f docker-compose.prod.yml ps postgres

# 2. Verify connectivity
docker-compose -f docker-compose.prod.yml exec postgres psql -U belsuite -d belsuite -c "SELECT 1"

# 3. Check connection pool
docker-compose -f docker-compose.prod.yml exec postgres psql -U belsuite -d belsuite -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Restart if needed
docker-compose -f docker-compose.prod.yml restart postgres
docker-compose -f docker-compose.prod.yml restart backend  # Reconnect backend
```

### High Memory Usage

```bash
# 1. Identify process
docker stats

# 2. Check memory limit
docker inspect belsuite-backend-prod --format='{{.HostConfig.Memory}}'

# 3. Increase if needed (docker-compose.prod.yml)
# Modify memory: "512m" to "1g"

# 4. Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Disk Space Critical

```bash
# 1. Check usage
df -h

# 2. Check container logs
du -sh /var/lib/docker/containers/*/

# 3. Clear old logs (Elasticsearch)
curl -X DELETE "elasticsearch:9200/belsuite-*"

# 4. Cleanup older backups
find /app/belsuite/backups -mtime +30 -delete
```

---

## 📈 Performance Optimization

### Response Times Slow?

1. **Check Prometheus** → Is CPU/Memory high?
2. **Scale out** → Add more backend replicas
3. **Check database** → Are queries slow?
4. **Enable caching** → Redis TTL optimization
5. **Review logs** → Find bottlenecks

### Database Slow?

```bash
# Find slow queries
docker-compose -f docker-compose.prod.yml exec postgres psql -U belsuite -d belsuite << EOF
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
EOF

# Create index for slow query
docker-compose -f docker-compose.prod.yml exec postgres psql -U belsuite -d belsuite -c "CREATE INDEX idx_organization_created ON organizations(created_at DESC);"
```

### Cache Effectiveness?

```bash
# Check Redis memory
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO stats

# Monitor hit ratio
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO keyspace
```

---

## 💰 Cost Optimization

### Docker Compose

**Baseline:** 1 server (8GB RAM, 4 CPU)
**Cost:** $50-100/month

**Optimization:**
- Right-size containers
- Use reserved instances
- Schedule non-critical tasks to off-peak

### Kubernetes

**Baseline:** 3-node cluster
**Cost:** $200-500/month

**Optimization:**
- Spot instances (70% discount)
- HPA min replicas
- Pod resource requests/limits
- Node auto-scaling

**Formula:** (Node Count × Instance Price) + (Storage + Networking)

---

## 📞 Support & Escalation

**Level 1 - Self Service:**
- Check dashboard at https://monitoring.belsuite.app
- Review logs at https://logs.belsuite.app
- Read troubleshooting guide

**Level 2 - Alert Process:**
- Slack notifications sent to #alerts
- Auto-pages on-call engineer
- Incident ticket created

**Level 3 - Manual Escalation:**
- Email: ops@belsuite.app
- Slack: @devops-team
- Phone: On-call number (in Slack)

---

## 📚 Additional Resources

| Resource | URL |
|----------|-----|
| DevOps Guide | See DEVOPS_GUIDE.md |
| Architecture Docs | See ARCHITECTURE.md |
| API Documentation | See API_DOCUMENTATION.md |
| Deployment Logs | GitHub Actions |
| Status Page | https://status.belsuite.app |

---

**Last Updated:** April 1, 2026
**Maintained By:** DevOps Team
**Next Review:** Q2 2026
