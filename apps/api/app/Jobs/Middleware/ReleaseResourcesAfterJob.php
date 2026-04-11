<?php

namespace App\Jobs\Middleware;

use Illuminate\Support\Facades\DB;

/**
 * Ensures queue workers (including long-lived Octane-adjacent workers) do not
 * retain DB sockets or unbounded memory across job boundaries.
 */
final class ReleaseResourcesAfterJob
{
    public function handle(object $job, callable $next): mixed
    {
        try {
            return $next($job);
        } finally {
            $this->releaseDatabaseConnections();
            if (function_exists('gc_collect_cycles')) {
                gc_collect_cycles();
            }
        }
    }

    private function releaseDatabaseConnections(): void
    {
        foreach (array_keys(config('database.connections', [])) as $name) {
            try {
                DB::disconnect($name);
            } catch (\Throwable) {
                //
            }
        }
    }
}
