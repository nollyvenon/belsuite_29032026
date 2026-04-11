<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tenant Context Header
    |--------------------------------------------------------------------------
    |
    | Incoming requests can provide a tenant id through this header. The
    | ResolveTenant middleware will use this value when deriving context.
    |
    */
    'header' => env('TENANT_HEADER', 'X-Tenant-ID'),

    /*
    |--------------------------------------------------------------------------
    | Tenant Query Parameter
    |--------------------------------------------------------------------------
    */
    'query_key' => env('TENANT_QUERY_KEY', 'tenant_id'),
];

