# 📊 Monitoring & Observability Guide

## Overview

BelSuite implements comprehensive monitoring using:
- **Prometheus**: Metrics collection & storage
- **Grafana**: Visualization & dashboards
- **AlertManager**: Alert routing & notification
- **Elasticsearch/Kibana**: Centralized logging
- **Logstash**: Log aggregation & processing

---

## 1. Prometheus Metrics

### Exposed Metrics

**Backend Application** (`http://backend:3001/metrics`):

```
# HTTP Metrics
http_requests_total{method="GET", status="200"}
http_request_duration_seconds{endpoint="/api/users"}
http_requests_in_progress

# Database Metrics
db_query_duration_seconds
db_connections_active
db_connections_idle
db_transaction_duration_seconds

# Business Metrics
users_created_total
organizations_active
revenue_total
api_calls_today

# System Metrics
process_cpu_seconds_total
process_resident_memory_bytes
nodejs_heap_size_total_bytes
```

### Scrape Configuration

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3001']
    scrape_interval: 10s
```

### Query Examples

```promql
# Request rate (req/s)
rate(http_requests_total[5m])

# Error rate percentage  
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# API latency P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active database connections
db_connections_active

# Memory usage
process_resident_memory_bytes / 1024 / 1024  # MB
```

---

## 2. Grafana Dashboards

### Dashboard 1: Performance Overview

**Panels:**
- Request rate (req/s)
- Error rate (%)
- Latency (P50, P95, P99)
- Throughput by endpoint
- Top slow endpoints

**Timerange:** Last 6 hours

**Refresh:** 30 seconds

### Dashboard 2: Infrastructure Health

**Panels:**
- CPU usage (%)
- Memory usage (%)
- Disk I/O (read/write)
- Network traffic (in/out)
- Container status
- Pod restarts

### Dashboard 3: Database Performance

**Panels:**
- Active connections
- Query duration
- Slow queries (> 1s)
- Cache hit ratio
- Replication lag
- Transactions per second

### Dashboard 4: Business Metrics

**Panels:**
- Active users (today)
- Revenue (today/month)
- API calls per minute
- User signup rate
- Subscription status

### Import Pre-built Dashboards

```bash
# Visit Grafana UI
https://monitoring.belsuite.app

# Dashboards → Import → Search for:
- "Node Exporter" (ID: 1860)
- "PostgreSQL" (ID: 9628)
- "Redis" (ID: 11114)
- "Docker Containers" (ID: 1229)
```

---

## 3. Alert Rules

### Alert Groups

**Critical Alerts** (Page on-call)

```yaml
- alert: BackendDown
  expr: up{job="backend"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Backend is down"
```

**High Priority** (Desktop notification)

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: high
```

**Medium Priority** (Logged)

```yaml
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
  for: 5m
  labels:
    severity: warning
```

### Alert Routing

```
Prometheus Alert
    ↓
AlertManager
    ├─→ CRITICAL severity
    │   └─→ Slack + PagerDuty
    ├─→ HIGH severity
    │   └─→ Slack
    └─→ WARNING severity
        └─→ Email + Slack (batched)
```

---

## 4. Kibana Logging

### Log Sources

| Source | Format | Frequency |
|--------|--------|-----------|
| Backend app | JSON | Continuous |
| Docker daemon | JSON | Per event |
| Nginx | Combined | Per request |
| PostgreSQL | Text | Per statement |
| Elasticsearch | JSON | Per event |

### Index Strategy

```
belsuite-2026.04.01               # All logs
belsuite-errors-2026.04.01        # Error logs only
belsuite-audit-2026.04.01         # User actions
```

**Retention:** 30 days (configurable)

### Log Queries

**Find errors:**
```json
{
  "query": {
    "match": {
      "level": "ERROR"
    }
  }
}
```

**Find slow API calls:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "tags": "api" } },
        { "range": { "duration": { "gte": 1000 } } }
      ]
    }
  }
}
```

**User actions audit:**
```json
{
  "query": {
    "match": {
      "user_id": "user_123"
    }
  }
}
```

### Create Visualizations

1. Go to Kibana → Discover
2. Select index: `belsuite-*`
3. Filter: `level: ERROR`
4. Select fields to display
5. Create visualization
6. Add to dashboard

---

## 5. Custom Metrics

### Add Application Metrics

**Backend (NestJS):**

```typescript
import { Counter, Histogram } from 'prom-client';

// Define metrics
const usersCreated = new Counter({
  name: 'users_created_total',
  help: 'Total users created'
});

const organizationRevenue = new Histogram({
  name: 'organization_revenue',
  help: 'Revenue per organization',
  labelNames: ['tier']
});

// Use in code
@Post('users')
async createUser(createUserDto: CreateUserDto) {
  const user = await this.usersService.create(createUserDto);
  usersCreated.inc();
  return user;
}
```

**Expose metrics:**

```typescript
// app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register()
  ]
})
export class AppModule {}
```

---

## 6. Alerts Configuration

### Slack Integration

**.env.prod:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T0000/B0000/XXXX
```

**Alertmanager template:**
```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#alerts'
        title: "{{ .GroupLabels.alertname }}"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
```

### PagerDuty Integration

**.env.prod:**
```bash
PAGERDUTY_SERVICE_KEY=sk_...
PAGERDUTY_ENABLED=true
```

**High severity triggers incident:**
```yaml
- alert: CriticalError
  annotations:
    severity: critical
  # Routed to PagerDuty via AlertManager
```

---

## 7. SLA Monitoring

### Define SLOs

```yaml
# Service Level Objectives
- Availability: 99.9% (43 minutes downtime/month)
- Latency P99: < 2 seconds
- Error Rate: < 0.1%
```

### Track SLI

```promql
# Availability SLI
(1 - (rate(http_requests_total{status=~"5.."}[30m]) / rate(http_requests_total[30m]))) * 100

# Latency SLI
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[30m]))

# Error Rate SLI
rate(http_requests_total{status=~"5.."}[30m]) / rate(http_requests_total[30m]) * 100
```

### Alert on SLO Violation

```yaml
- alert: AvailabilitySLOViolation
  expr: (1 - error_rate) < 0.999  # 99.9%
  for: 5m
  labels:
    severity: high
```

---

## 8. Dashboard Best Practices

### Performance Dashboard Layout

```
┌────────────────────────────────────┐
│  Timerange: [Last 6h] Refresh: [30s]
├────────────────────────────────────┤
│  Request Rate (req/s)   Error Rate (%)
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓
├────────────────────────────────────┤
│  Latency P95 (ms)      Latency P99 (ms)
│  ▓▓▓▓▓▓▓▓▓▓            ▓▓▓▓▓▓▓▓▓
├────────────────────────────────────┤
│  Top 10 Slow Endpoints
│  /api/users/search     avg:1234ms
│  /api/reports          avg:892ms
└────────────────────────────────────┘
```

### Recommended Metrics

**Always Display:**
- Request rate
- Error rate
- Latency (P50, P95, P99)
- Resource usage (CPU, Memory)
- Availability %

**Context-Specific:**
- Database: Query time, connections, slow queries
- Cache: Hit ratio, evictions, memory
- Queue: Size, latency, failures

---

## 9. Troubleshooting Monitoring

### Prometheus scrape failing?

```bash
# Check targets
curl http://prometheus:9090/api/v1/targets

# View logs
docker-compose logs prometheus

# Verify backend metrics endpoint
curl http://backend:3001/metrics
```

### Grafana dashboard empty?

```bash
# Verify Elasticsearch has data
curl elasticsearch:9200/belsuite-*/_count

# Check Kibana connection settings
# Settings → Data Sources → Elasticsearch

# Verify timestamps
curl 'elasticsearch:9200/belsuite-*/_search?size=1' | jq '.hits.hits[0]._source'
```

### Missing alerts?

```bash
# Check AlertManager config
curl http://alertmanager:9093/api/v1/status

# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"Test alert"}'

# View alert rules
curl http://prometheus:9090/api/v1/rules
```

---

## 10. Metrics Retention & Cleanup

### Configure Retention

```bash
# docker-compose.prod.yml
prometheus:
  command:
    - '--storage.tsdb.retention.time=90d'
    - '--storage.tsdb.retention.size=50GB'
```

### Delete Old Logs

```bash
# Keep last 30 days
curl -X DELETE "elasticsearch:9200/belsuite-$(date -d '30 days ago' +'%Y.%m.%d')"

# Automate with curator
cat <<EOF > curator-actions.yml
actions:
  1:
    action: delete_indices
    filters:
    - filtertype: pattern
      value: 'belsuite-'
    - filtertype: age
      source: creation_date
      direction: older
      unit: days
      unit_count: 30
EOF
```

---

## 📞 Support

For monitoring issues:
- Email: monitoring@belsuite.app
- Slack: @monitoring-team
- Doc: DEVOPS_GUIDE.md

**Escalation Path:**
1. Check dashboard at monitoring.belsuite.app
2. Review logs at logs.belsuite.app
3. Check alert routing in AlertManager
4. Contact ops team
