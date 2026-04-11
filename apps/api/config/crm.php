<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CRM read caching (Octane)
    |--------------------------------------------------------------------------
    |
    | Seconds to cache expensive read endpoints per organization.
    | 0 disables. Use Redis or octane cache store for worker-local hits.
    |
    */

    'stats_cache_ttl' => (int) env('CRM_STATS_CACHE_TTL', 0),

    'board_cache_ttl' => (int) env('CRM_BOARD_CACHE_TTL', 0),

];
