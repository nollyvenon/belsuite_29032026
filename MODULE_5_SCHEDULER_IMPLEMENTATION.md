# Module 5: Scheduler - Complete Implementation

Status: Production-ready core scheduling flow with policy enforcement

This module now covers:

- Scheduled post creation, update, reschedule, cancel, and calendar views
- Queue-backed publish automation via BullMQ
- Retry handling with exponential backoff
- Bulk scheduling batches
- Optimal-time recommendations per platform
- Auto-repost automation
- Organization-level scheduling policy stored in organization metadata
- Timezone-aware schedule preview
- Blackout-window enforcement
- Outgoing webhook triggers for scheduler lifecycle events

New scheduling endpoints:

- GET /api/social/settings/scheduling
- PATCH /api/social/settings/scheduling
- POST /api/social/schedule/preview

Scheduling policy shape:

```json
{
  "timezone": "America/New_York",
  "minimumLeadMinutes": 30,
  "blackoutWindows": [
    {
      "name": "Quiet Hours",
      "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
      "startTime": "22:00",
      "endTime": "06:00"
    }
  ]
}
```

Scheduler webhook events emitted to active webhook subscriptions:

- social.post.created
- social.post.updated
- social.post.rescheduled
- social.post.cancelled
- social.post.published
- social.post.failed

Validation behavior:

- Explicit scheduled times must respect minimum lead time
- Explicit scheduled times are rejected when they land inside blackout windows
- Optimal-time scheduling automatically previews the next allowed slot outside blackout windows

Verification target:

- npm run build:backend