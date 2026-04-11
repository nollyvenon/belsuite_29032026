<?php

namespace App\Octane\Listeners;

use Illuminate\Support\Facades\Log;
use Laravel\Octane\Contracts\OperationTerminated;

/**
 * Per-operation memory telemetry for long-lived Octane workers.
 *
 * Use OCTANE_MEMORY_ALERT_MB + LOG_STACK including `slack` (or APM) to page on leaks.
 */
final class LogOctaneWorkerMemory
{
    private static int $operations = 0;

    public static function resetForNewWorker(): void
    {
        self::$operations = 0;
    }

    public function handle(OperationTerminated $event): void
    {
        if (! (bool) config('octane.monitoring.enabled', true)) {
            return;
        }

        self::$operations++;

        $currentMb = memory_get_usage(true) / 1024 / 1024;
        $peakMb = memory_get_peak_usage(true) / 1024 / 1024;
        $alertMb = (float) config('octane.monitoring.memory_alert_mb', 192);
        $channel = (string) config('octane.monitoring.log_channel', 'octane');

        if ($currentMb >= $alertMb || $peakMb >= $alertMb) {
            Log::channel($channel)->warning('octane.worker_memory_high', [
                'memory_mb' => round($currentMb, 2),
                'peak_mb' => round($peakMb, 2),
                'threshold_mb' => $alertMb,
                'pid' => getmypid(),
                'operations' => self::$operations,
            ]);
        }

        $sampleEvery = max(0, (int) config('octane.monitoring.sample_every_n_ops', 0));
        if ($sampleEvery > 0 && self::$operations % $sampleEvery === 0) {
            Log::channel($channel)->info('octane.worker_memory_sample', [
                'memory_mb' => round($currentMb, 2),
                'peak_mb' => round($peakMb, 2),
                'pid' => getmypid(),
                'operations' => self::$operations,
            ]);
        }
    }
}
