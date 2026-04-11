<?php

namespace App\Octane\Listeners;

use Laravel\Octane\Events\WorkerStarting;

/**
 * Clears per-process safeguard counters when an Octane worker (re)starts.
 */
final class ResetOctaneSafeguardState
{
    public function handle(WorkerStarting $event): void
    {
        LogOctaneWorkerMemory::resetForNewWorker();
        DetectOctaneMemoryLeakAndRecycle::resetForNewWorker();
    }
}
