<?php

namespace App\Octane\Listeners;

use Illuminate\Support\Facades\Log;
use Laravel\Octane\Events\RequestHandled;

/**
 * Logs requests whose wall time exceeds octane.safeguards.slow_request_ms.
 */
final class LogSlowOctaneRequests
{
    public function handle(RequestHandled $event): void
    {
        if (! (bool) config('octane.safeguards.enabled', true)) {
            return;
        }

        $started = $event->request->attributes->get('octane_request_started_at');
        if (! is_float($started) && ! is_int($started)) {
            return;
        }

        $thresholdMs = max(1, (int) config('octane.safeguards.slow_request_ms', 2000));
        $elapsedMs = (int) round((microtime(true) - (float) $started) * 1000);

        if ($elapsedMs < $thresholdMs) {
            return;
        }

        $channel = (string) config('octane.monitoring.log_channel', 'octane');

        Log::channel($channel)->warning('octane.slow_request', [
            'duration_ms' => $elapsedMs,
            'threshold_ms' => $thresholdMs,
            'method' => $event->request->getMethod(),
            'path' => $event->request->path(),
            'status' => $event->response->getStatusCode(),
            'pid' => getmypid(),
        ]);
    }
}
