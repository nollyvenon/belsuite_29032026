<?php

namespace App\Jobs;

use App\Models\Video\VideoProject;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Stateless video render pipeline step: updates status by primary key only.
 *
 * @see config/queue.php queue.names.video
 */
final class RenderVideoJob extends AbstractMonitoredJob
{
    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 600];

    public int $timeout = 900;

    public function __construct(
        public readonly string $jobPublicId,
        public readonly string $projectId,
    ) {
        $this->onQueue((string) config('queue.names.video', 'video'));
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            ...parent::middleware(),
            (new WithoutOverlapping('video:'.$this->projectId))
                ->releaseAfter(120)
                ->expireAfter(1800),
        ];
    }

    public function handle(): void
    {
        $started = microtime(true);
        $this->logLifecycle('started');

        try {
            VideoProject::query()->where('id', $this->projectId)->update(['status' => 'READY']);
            Cache::put('video_job:'.$this->jobPublicId, [
                'status' => 'completed',
                'projectId' => $this->projectId,
                'finishedAt' => now()->toIso8601String(),
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ], now()->addHours(6));
        } finally {
            $this->logLifecycle('finished', [
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ]);
        }
    }

    public function failed(?Throwable $exception = null): void
    {
        parent::failed($exception);

        try {
            VideoProject::query()->where('id', $this->projectId)->update(['status' => 'FAILED']);
        } catch (\Throwable) {
            //
        }

        Cache::put('video_job:'.$this->jobPublicId, [
            'status' => 'failed',
            'projectId' => $this->projectId,
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
            'project_id' => $this->projectId,
            'queue' => $this->queue,
            'attempt' => $this->attempts(),
        ], $context));
    }
}
