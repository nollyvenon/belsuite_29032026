<?php

$connectionClose = ! in_array(
    strtolower((string) env('INTEGRATION_HTTP_CONNECTION_CLOSE', 'true')),
    ['0', 'false', 'no', 'off'],
    true,
);

return [

    /*
    |--------------------------------------------------------------------------
    | Outbound integration HTTP (Octane-safe tuning)
    |--------------------------------------------------------------------------
    |
    | Each profile builds a fresh Illuminate HTTP PendingRequest per call.
    | Do not cache PendingRequest or Guzzle clients on singletons across requests.
    |
    | connection_close: send "Connection: close" to reduce stale keep-alive
    | sockets in long-lived Octane workers when talking to flaky upstreams.
    |
    */

    'connection_retry_usleep' => (int) env('INTEGRATION_CONNECTION_RETRY_USLEEP', 150_000),

    'http' => [
        'nest' => [
            'timeout' => (int) env('INTEGRATION_HTTP_NEST_TIMEOUT', 15),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_NEST_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_NEST_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_NEST_RETRY_SLEEP_MS', 250),
            'connection_close' => $connectionClose,
        ],
        'slack' => [
            'timeout' => (int) env('INTEGRATION_HTTP_SLACK_TIMEOUT', 12),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_SLACK_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_SLACK_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_SLACK_RETRY_SLEEP_MS', 300),
            'connection_close' => $connectionClose,
        ],
        'whatsapp' => [
            'timeout' => (int) env('INTEGRATION_HTTP_WHATSAPP_TIMEOUT', 20),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_WHATSAPP_CONNECT_TIMEOUT', 8),
            'retries' => (int) env('INTEGRATION_HTTP_WHATSAPP_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_WHATSAPP_RETRY_SLEEP_MS', 400),
            'connection_close' => $connectionClose,
        ],
        'twilio_sms' => [
            'timeout' => (int) env('INTEGRATION_HTTP_TWILIO_TIMEOUT', 15),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_TWILIO_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_TWILIO_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_TWILIO_RETRY_SLEEP_MS', 300),
            'connection_close' => $connectionClose,
        ],
        'resend' => [
            'timeout' => (int) env('INTEGRATION_HTTP_RESEND_TIMEOUT', 15),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_RESEND_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_RESEND_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_RESEND_RETRY_SLEEP_MS', 300),
            'connection_close' => $connectionClose,
        ],
        'postmark' => [
            'timeout' => (int) env('INTEGRATION_HTTP_POSTMARK_TIMEOUT', 15),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_POSTMARK_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_POSTMARK_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_POSTMARK_RETRY_SLEEP_MS', 300),
            'connection_close' => $connectionClose,
        ],
        'outbound_webhook' => [
            'timeout' => (int) env('INTEGRATION_HTTP_WEBHOOK_TIMEOUT', 12),
            'connect_timeout' => (int) env('INTEGRATION_HTTP_WEBHOOK_CONNECT_TIMEOUT', 5),
            'retries' => (int) env('INTEGRATION_HTTP_WEBHOOK_RETRIES', 0),
            'retry_sleep_ms' => (int) env('INTEGRATION_HTTP_WEBHOOK_RETRY_SLEEP_MS', 250),
            'connection_close' => $connectionClose,
        ],
    ],

];
