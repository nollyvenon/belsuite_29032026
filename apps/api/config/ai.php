<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI generation defaults (Octane-friendly)
    |--------------------------------------------------------------------------
    |
    | Long-running LLM work should not block Octane workers. Prefer async
    | (queue) generation in production; allow sync for local/tests unless
    | AI_ASYNC_DEFAULT is set explicitly.
    |
    */

    'async_default' => match (strtolower((string) env('AI_ASYNC_DEFAULT', ''))) {
        'true', '1', 'yes' => true,
        'false', '0', 'no' => false,
        default => ! in_array((string) env('APP_ENV', 'production'), ['local', 'testing'], true),
    },

    'async_prompt_min_length' => (int) env('AI_ASYNC_PROMPT_MIN_LENGTH', 400),

    /*
    | Short-lived cache for identical prompts per tenant (seconds).
    | 0 disables. Use redis or octane cache for cross-request hits.
    |
    */

    'response_cache_ttl' => (int) env('AI_RESPONSE_CACHE_TTL', 0),

];
