<?php

namespace App\Octane\Listeners;

use Laravel\Octane\Events\RequestReceived;

/**
 * Records wall-clock start for slow-request detection (see LogSlowOctaneRequests).
 */
final class MarkOctaneRequestStart
{
    public function handle(RequestReceived $event): void
    {
        if (! (bool) config('octane.safeguards.enabled', true)) {
            return;
        }

        $event->request->attributes->set('octane_request_started_at', microtime(true));
    }
}
