<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Health endpoint micro-cache
    |--------------------------------------------------------------------------
    |
    | Short TTL reduces repeated JSON work and downstream probes under load.
    | Set to 0 to disable (useful in tests that assert fresh timestamps).
    |
    */

    'health_cache_ttl' => (int) env('API_HEALTH_CACHE_TTL', 5),

];
