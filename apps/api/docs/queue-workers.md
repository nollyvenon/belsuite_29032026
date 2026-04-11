# Queue workers & job structure (Octane-safe)

HTTP runs under **Octane**; **queue workers are separate PHP processes**. Jobs must be **stateless** (primitives / IDs only), avoid retaining memory across jobs, and release resources after each run.

## Job architecture

| Class | Queue | Retries / backoff | Timeout | Overlap guard | Failure surface |
|-------|-------|-------------------|---------|----------------|-----------------|
| `GenerateAiContentJob` | `ai` | 4 / 15s–5m | 600s | per org + job id | `ai_job:{id}` cache + logs |
| `RenderVideoJob` | `video` | 3 / 30s–10m | 900s | per `projectId` | DB `FAILED` + `video_job:{id}` cache + logs |
| `ProcessCampaignAutomationJob` | `campaigns` | 5 / 20s–30m | 420s | per org + workflow | `campaign_run:{id}` cache + logs |

All extend **`AbstractMonitoredJob`**, which provides:

- `$tries`, `$backoff`, `$timeout`, `$failOnTimeout`, `$maxExceptions`
- Middleware **`ReleaseResourcesAfterJob`**: disconnects **all** DB connections after each job and runs `gc_collect_cycles()`
- **`failed()`** structured logging to `config('queue.monitoring.log_channel')`

Optional per-job lifecycle logs when `QUEUE_LOG_PROCESSING=true`.

## Dispatching

- **AI**: `GenerateAiContentJob::dispatch(...)` (already used from `AiController`; targets queue `config('queue.names.ai')`).
- **Video**: `RenderVideoJob::dispatch(...)` (`VideoProjectController`).
- **Campaigns**: `CampaignAutomationDispatcher::dispatchRun($organizationId, $workflowId, $context)` — context must be **JSON-serializable scalars only**.

## Configuration

```env
QUEUE_CONNECTION=failover_redis
REDIS_HOST=127.0.0.1
REDIS_QUEUE_RETRY_AFTER=960

QUEUE_MONITOR_LOG_CHANNEL=queue
QUEUE_LOG_PROCESSING=false
```

Use `LOG_STACK=single,queue` if you want queue logs in `storage/logs/queue.log`.

## Workers

See `deploy/supervisor/belsuite-queue-workers.conf` for **four programs**:

1. `default` — general jobs  
2. `ai` — two workers, higher memory, long timeout  
3. `video` — one worker, long timeout, more memory  
4. `campaigns` — two workers for automation throughput  

Flags:

- **`--max-time`**: worker exits gracefully so the OS/supervisor restarts a fresh PHP process (limits memory drift).
- **`--rest`**: brief pause between jobs (reduces thermal / DB burst when combined with Octane HTTP).

Local one-liner (development):

```bash
php artisan queue:work failover_redis --queue=default,ai,video,campaigns --tries=3 --max-time=600
```

## Monitoring

1. **Laravel**: `php artisan queue:failed`, `queue:retry all`, Horizon (optional package).  
2. **Logs**: `queue.worker.failing` (worker-level) + `queue.job.failed` (job `failed()` method).  
3. **Caches**: job status payloads on `ai_job:*`, `video_job:*`, `campaign_run:*` for UI polling.
