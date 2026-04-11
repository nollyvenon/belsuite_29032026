<?php

namespace App\Octane\Listeners;

use Laravel\Octane\Events\RequestReceived;
use Laravel\Octane\Events\TaskReceived;
use Laravel\Octane\Events\TickReceived;

/**
 * Octane workers reuse one application instance; never leave per-request
 * container bindings (tenant_id, correlation_id) attached to the sandbox.
 */
final class FlushRequestScopedContainerBindings
{
    private const BINDINGS = ['tenant_id', 'correlation_id'];

    public function handle(RequestReceived|TaskReceived|TickReceived $event): void
    {
        $sandbox = $event->sandbox;

        foreach (self::BINDINGS as $abstract) {
            if ($sandbox->bound($abstract)) {
                $sandbox->forgetInstance($abstract);
            }
        }
    }
}
