<?php

return [
    'nest_fallback_enabled' => filter_var(env('NEST_FALLBACK_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
    'deprecation_ready' => filter_var(env('NEST_DEPRECATION_READY', false), FILTER_VALIDATE_BOOLEAN),
];

