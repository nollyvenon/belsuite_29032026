<?php

namespace App\Jobs;

use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Stateless campaign / workflow execution slice. Pass only IDs and a small
 * JSON-serializable context (no models, no closures).
 *
 * @see config/queue.php queue.names.campaigns
 */
final class ProcessCampaignAutomationJob extends AbstractMonitoredJob
{
    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [20, 120, 300, 900, 1800];

    public int $timeout = 420;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        public readonly string $runPublicId,
        public readonly string $organizationId,
        public readonly string $workflowId,
        public readonly array $context = [],
    ) {
        $this->onQueue((string) config('queue.names.campaigns', 'campaigns'));
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            ...parent::middleware(),
            (new WithoutOverlapping('campaign:'.$this->organizationId.':'.$this->workflowId))
                ->releaseAfter(60)
                ->expireAfter(3600),
        ];
    }

    public function handle(): void
    {
        $started = microtime(true);
        $this->logLifecycle('started');

        try {
            // Placeholder: replace with real automation steps (webhooks, email, CRM updates).
            Log::channel((string) config('queue.monitoring.log_channel', 'stack'))->debug('campaign.automation.tick', [
                'run_id' => $this->runPublicId,
                'workflow_id' => $this->workflowId,
                'organization_id' => $this->organizationId,
            ]);

            Cache::put('campaign_run:'.$this->runPublicId, [
                'status' => 'completed',
                'workflowId' => $this->workflowId,
                'finishedAt' => now()->toIso8601String(),
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ], now()->addHours(12));
        } finally {
            $this->logLifecycle('finished', [
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ]);
        }
    }

    public function failed(?Throwable $exception = null): void
    {
        parent::failed($exception);

        Cache::put('campaign_run:'.$this->runPublicId, [
            'status' => 'failed',
            'workflowId' => $this->workflowId,
            'error' => $exception?->getMessage() ?? 'Unknown error',
            'failedAt' => now()->toIso8601String(),
            'attempts' => $this->attempts(),
        ], now()->addHours(24));
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function logLifecycle(string $phase, array $extra = []): void
    {
        if (! (bool) config('queue.monitoring.log_processing', false)) {
            return;
        }

        Log::channel((string) config('queue.monitoring.log_channel', 'stack'))->info('queue.job.'.$phase, array_merge([
            'job' => static::class,
            'run_id' => $this->runPublicId,
            'workflow_id' => $this->workflowId,
            'organization_id' => $this->organizationId,
            'queue' => $this->queue,
            'attempt' => $this->attempts(),
        ], $extra));
    }
}
