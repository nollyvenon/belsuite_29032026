<?php

namespace App\Jobs;

use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

/**
 * Stateless AI generation: only primitives in the payload; result written to cache.
 *
 * @see config/queue.php queue.names.ai
 */
final class GenerateAiContentJob extends AbstractMonitoredJob
{
    public int $tries = 4;

    /** @var list<int> */
    public array $backoff = [15, 60, 180, 300];

    public int $timeout = 600;

    public function __construct(
        public readonly string $jobPublicId,
        public readonly string $organizationId,
        public readonly string $prompt,
    ) {
        $this->onQueue((string) config('queue.names.ai', 'ai'));
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            ...parent::middleware(),
            (new WithoutOverlapping($this->organizationId.':'.$this->jobPublicId))
                ->releaseAfter(30)
                ->expireAfter(720),
        ];
    }

    public function handle(): void
    {
        $started = microtime(true);
        $this->logLifecycle('started');

        try {
            $text = 'Generated placeholder output for: '.Str::limit($this->prompt, 200);
            Cache::put('ai_job:'.$this->jobPublicId, [
                'status' => 'completed',
                'text' => $text,
                'finishedAt' => now()->toIso8601String(),
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ], now()->addHour());
        } finally {
            $this->logLifecycle('finished', [
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ]);
        }
    }

    public function failed(?Throwable $exception = null): void
    {
        parent::failed($exception);

        Cache::put('ai_job:'.$this->jobPublicId, [
            'status' => 'failed',
            'error' => $exception?->getMessage() ?? 'Unknown error',
            'failedAt' => now()->toIso8601String(),
            'attempts' => $this->attempts(),
        ], now()->addHours(6));
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logLifecycle(string $phase, array $context = []): void
    {
        if (! (bool) config('queue.monitoring.log_processing', false)) {
            return;
        }

        \Illuminate\Support\Facades\Log::channel((string) config('queue.monitoring.log_channel', 'stack'))->info('queue.job.'.$phase, array_merge([
            'job' => static::class,
            'job_public_id' => $this->jobPublicId,
            'organization_id' => $this->organizationId,
            'queue' => $this->queue,
            'attempt' => $this->attempts(),
        ], $context));
    }
}
