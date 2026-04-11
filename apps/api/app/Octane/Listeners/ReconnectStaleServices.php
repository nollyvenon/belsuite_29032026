<?php

namespace App\Octane\Listeners;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Laravel\Octane\Events\RequestReceived;
use Throwable;

/**
 * Best-effort reconnect before handling a request (stale DB/Redis after idle or network blips).
 */
final class ReconnectStaleServices
{
    public function handle(RequestReceived $event): void
    {
        if (! (bool) config('octane.safeguards.enabled', true)) {
            return;
        }

        if ($this->shouldRecoverDatabase()) {
            $this->pingOrReconnectDatabase();
        }

        if ($this->shouldRecoverRedis() && app()->bound('redis')) {
            $this->pingOrPurgeRedis();
        }
    }

    private function shouldRecoverDatabase(): bool
    {
        return ! in_array(strtolower((string) env('OCTANE_RECOVER_DB_ON_REQUEST', 'true')), ['0', 'false', 'no', 'off'], true);
    }

    private function shouldRecoverRedis(): bool
    {
        return ! in_array(strtolower((string) env('OCTANE_RECOVER_REDIS_ON_REQUEST', 'false')), ['0', 'false', 'no', 'off'], true);
    }

    private function pingOrReconnectDatabase(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            try {
                DB::reconnect();
                Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->notice('octane.db_reconnected', [
                    'message' => $e->getMessage(),
                    'pid' => getmypid(),
                ]);
            } catch (Throwable $inner) {
                Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->error('octane.db_reconnect_failed', [
                    'message' => $inner->getMessage(),
                    'pid' => getmypid(),
                ]);
            }
        }
    }

    private function pingOrPurgeRedis(): void
    {
        try {
            Redis::connection()->ping();
        } catch (Throwable $e) {
            try {
                Redis::purge();
                Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->notice('octane.redis_purged', [
                    'message' => $e->getMessage(),
                    'pid' => getmypid(),
                ]);
            } catch (Throwable $inner) {
                Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->error('octane.redis_purge_failed', [
                    'message' => $inner->getMessage(),
                    'pid' => getmypid(),
                ]);
            }
        }
    }
}
