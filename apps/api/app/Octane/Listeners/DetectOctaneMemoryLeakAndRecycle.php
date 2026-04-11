<?php

namespace App\Octane\Listeners;

use Illuminate\Support\Facades\Log;
use Laravel\Octane\Contracts\Client;
use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Contracts\StoppableClient;
use Throwable;

/**
 * Detects monotonic memory growth across many requests (leak heuristic) and
 * optionally stops the worker so the process manager spawns a fresh one.
 *
 * Also enforces a hard memory ceiling via immediate worker recycle.
 */
final class DetectOctaneMemoryLeakAndRecycle
{
    private static ?float $lastMemoryMb = null;

    private static int $growthStreak = 0;

    public static function resetForNewWorker(): void
    {
        self::$lastMemoryMb = null;
        self::$growthStreak = 0;
    }

    public function handle(OperationTerminated $event): void
    {
        if (! (bool) config('octane.safeguards.enabled', true)) {
            return;
        }

        $channel = (string) config('octane.monitoring.log_channel', 'octane');
        $currentMb = memory_get_usage(true) / 1024 / 1024;
        $hardStop = (float) config('octane.safeguards.memory_hard_stop_mb', 512);

        if ($currentMb >= $hardStop) {
            Log::channel($channel)->critical('octane.memory_hard_stop', [
                'memory_mb' => round($currentMb, 2),
                'limit_mb' => $hardStop,
                'pid' => getmypid(),
            ]);
            if ($this->shouldRestartOnHardMemory()) {
                $this->stopWorker($event, 'memory_hard_stop');
            }

            return;
        }

        $deltaMb = (float) config('octane.safeguards.memory_leak_delta_mb', 5);
        $streakNeed = max(2, (int) config('octane.safeguards.memory_leak_streak', 20));

        if (self::$lastMemoryMb !== null && $currentMb > self::$lastMemoryMb + $deltaMb) {
            self::$growthStreak++;
        } else {
            self::$growthStreak = 0;
        }

        self::$lastMemoryMb = $currentMb;

        if (self::$growthStreak < $streakNeed) {
            return;
        }

        Log::channel($channel)->critical('octane.memory_leak_suspected', [
            'memory_mb' => round($currentMb, 2),
            'delta_mb' => $deltaMb,
            'streak' => self::$growthStreak,
            'pid' => getmypid(),
        ]);

        self::$growthStreak = 0;

        if ($this->shouldRestartOnLeakPattern()) {
            $this->stopWorker($event, 'memory_leak_pattern');
        }
    }

    private function shouldRestartOnHardMemory(): bool
    {
        return ! in_array(strtolower((string) env('OCTANE_RESTART_ON_HARD_MEMORY', 'true')), ['0', 'false', 'no', 'off'], true);
    }

    private function shouldRestartOnLeakPattern(): bool
    {
        return ! in_array(strtolower((string) env('OCTANE_RESTART_ON_LEAK_PATTERN', 'true')), ['0', 'false', 'no', 'off'], true);
    }

    private function stopWorker(OperationTerminated $event, string $reason): void
    {
        $sandbox = $event->sandbox();

        try {
            $client = $sandbox->make(Client::class);
            if ($client instanceof StoppableClient) {
                Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->alert('octane.worker_recycling', [
                    'reason' => $reason,
                    'pid' => getmypid(),
                ]);
                $client->stop();
            }
        } catch (Throwable $e) {
            Log::channel((string) config('octane.monitoring.log_channel', 'octane'))->error('octane.worker_stop_failed', [
                'reason' => $reason,
                'message' => $e->getMessage(),
                'pid' => getmypid(),
            ]);
        }
    }
}
