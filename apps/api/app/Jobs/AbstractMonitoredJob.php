<?php

namespace App\Jobs;

use App\Jobs\Middleware\ReleaseResourcesAfterJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Stateless queue job base: no Eloquent serialization, shared retry/timeout
 * defaults, resource cleanup middleware, and structured failure logging.
 */
abstract class AbstractMonitoredJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Backoff in seconds between retries (exponential-friendly list).
     *
     * @var list<int>
     */
    public array $backoff = [10, 45, 120];

    /**
     * Seconds before the worker kills the job (must exceed worst-case work).
     */
    public int $timeout = 300;

    public bool $failOnTimeout = true;

    /**
     * Stop retrying after this many exceptions (Laravel counts failures).
     */
    public int $maxExceptions = 2;

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            new ReleaseResourcesAfterJob,
        ];
    }

    public function failed(?Throwable $exception = null): void
    {
        $channel = (string) config('queue.monitoring.log_channel', 'stack');

        Log::channel($channel)->error('queue.job.failed', [
            'job' => static::class,
            'connection' => $this->connection,
            'queue' => $this->queue,
            'attempts' => $this->attempts(),
            'message' => $exception?->getMessage(),
            'exception' => $exception ? $exception::class : null,
        ]);
    }
}
