<?php

use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Events\RequestHandled;
use Laravel\Octane\Events\RequestReceived;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskReceived;
use Laravel\Octane\Events\TaskTerminated;
use Laravel\Octane\Events\TickReceived;
use Laravel\Octane\Events\TickTerminated;
use Laravel\Octane\Events\WorkerErrorOccurred;
use Laravel\Octane\Events\WorkerStarting;
use Laravel\Octane\Events\WorkerStopping;
use Laravel\Octane\Listeners\CloseMonologHandlers;
use Laravel\Octane\Listeners\CollectGarbage;
use Laravel\Octane\Listeners\DisconnectFromDatabases;
use Laravel\Octane\Listeners\EnsureUploadedFilesAreValid;
use Laravel\Octane\Listeners\EnsureUploadedFilesCanBeMoved;
use Laravel\Octane\Listeners\FlushOnce;
use Laravel\Octane\Listeners\FlushTemporaryContainerInstances;
use App\Octane\Listeners\DetectOctaneMemoryLeakAndRecycle;
use App\Octane\Listeners\ResetOctaneSafeguardState;
use App\Octane\Listeners\FlushRequestScopedContainerBindings;
use App\Octane\Listeners\LogOctaneWorkerMemory;
use App\Octane\Listeners\LogSlowOctaneRequests;
use App\Octane\Listeners\MarkOctaneRequestStart;
use App\Octane\Listeners\ReconnectStaleServices;
use Laravel\Octane\Listeners\FlushUploadedFiles;
use Laravel\Octane\Listeners\ReportException;
use Laravel\Octane\Listeners\StopWorkerIfNecessary;
use Laravel\Octane\Octane;

return [

    /*
    |--------------------------------------------------------------------------
    | Octane Server
    |--------------------------------------------------------------------------
    |
    | This value determines the default "server" that will be used by Octane
    | when starting, restarting, or stopping your server via the CLI. You
    | are free to change this to the supported server of your choosing.
    |
    | Supported: "roadrunner", "swoole", "frankenphp"
    |
    */

    'server' => env('OCTANE_SERVER', 'swoole'),

    /*
    |--------------------------------------------------------------------------
    | Bind & Port
    |--------------------------------------------------------------------------
    |
    | Used by `php artisan octane:start` when host/port flags are omitted.
    |
    */

    'host' => env('OCTANE_HOST', '127.0.0.1'),

    'port' => (int) env('OCTANE_PORT', 8000),

    /*
    |--------------------------------------------------------------------------
    | Workers & recycling
    |--------------------------------------------------------------------------
    |
    | workers / task_workers: integer or the string "auto" (CPU-based for Swoole).
    | max_requests: recycle a worker after N handled requests (primary leak guard).
    |
    */

    'workers' => env('OCTANE_WORKERS', 'auto'),

    'task_workers' => env('OCTANE_TASK_WORKERS', 'auto'),

    'max_requests' => (int) env('OCTANE_MAX_REQUESTS', 500),

    /*
    |--------------------------------------------------------------------------
    | Force HTTPS
    |--------------------------------------------------------------------------
    |
    | When this configuration value is set to "true", Octane will inform the
    | framework that all absolute links must be generated using the HTTPS
    | protocol. Otherwise your links may be generated using plain HTTP.
    |
    */

    'https' => env('OCTANE_HTTPS', false),

    /*
    |--------------------------------------------------------------------------
    | Octane Listeners
    |--------------------------------------------------------------------------
    |
    | All of the event listeners for Octane's events are defined below. These
    | listeners are responsible for resetting your application's state for
    | the next request. You may even add your own listeners to the list.
    |
    */

    'listeners' => [
        WorkerStarting::class => [
            ResetOctaneSafeguardState::class,
            EnsureUploadedFilesAreValid::class,
            EnsureUploadedFilesCanBeMoved::class,
        ],

        RequestReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            ...Octane::prepareApplicationForNextRequest(),
            FlushRequestScopedContainerBindings::class,
            ReconnectStaleServices::class,
            MarkOctaneRequestStart::class,
        ],

        RequestHandled::class => [
            LogSlowOctaneRequests::class,
        ],

        RequestTerminated::class => [
            FlushUploadedFiles::class,
        ],

        TaskReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            FlushRequestScopedContainerBindings::class,
        ],

        TaskTerminated::class => [
            //
        ],

        TickReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            FlushRequestScopedContainerBindings::class,
        ],

        TickTerminated::class => [
            //
        ],

        OperationTerminated::class => [
            FlushOnce::class,
            FlushTemporaryContainerInstances::class,
            ...(! in_array(strtolower((string) env('OCTANE_DISCONNECT_DATABASE', 'true')), ['0', 'false', 'no', 'off'], true)
                ? [DisconnectFromDatabases::class]
                : []),
            CollectGarbage::class,
            LogOctaneWorkerMemory::class,
            DetectOctaneMemoryLeakAndRecycle::class,
        ],

        WorkerErrorOccurred::class => [
            ReportException::class,
            StopWorkerIfNecessary::class,
        ],

        WorkerStopping::class => [
            CloseMonologHandlers::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Warm / Flush Bindings
    |--------------------------------------------------------------------------
    |
    | The bindings listed below will either be pre-warmed when a worker boots
    | or they will be flushed before every new request. Flushing a binding
    | will force the container to resolve that binding again when asked.
    |
    */

    'warm' => [
        ...Octane::defaultServicesToWarm(),
    ],

    'flush' => [
        //
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Swoole Tables
    |--------------------------------------------------------------------------
    |
    | While using Swoole, you may define additional tables as required by the
    | application. These tables can be used to store data that needs to be
    | quickly accessed by other workers on the particular Swoole server.
    |
    */

    'tables' => [
        //
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Swoole Cache Table
    |--------------------------------------------------------------------------
    |
    | While using Swoole, you may leverage the Octane cache, which is powered
    | by a Swoole table. You may set the maximum number of rows as well as
    | the number of bytes per row using the configuration options below.
    |
    */

    'cache' => [
        'rows' => (int) env('OCTANE_TABLE_CACHE_ROWS', 10000),
        'bytes' => (int) env('OCTANE_TABLE_CACHE_BYTES', 65536),
    ],

    /*
    |--------------------------------------------------------------------------
    | File Watching
    |--------------------------------------------------------------------------
    |
    | The following list of files and directories will be watched when using
    | the --watch option offered by Octane. If any of the directories and
    | files are changed, Octane will automatically reload your workers.
    |
    */

    'watch' => [
        'app',
        'bootstrap',
        'config/**/*.php',
        'database/**/*.php',
        'public/**/*.php',
        'resources/**/*.php',
        'routes',
        'composer.lock',
        '.env',
    ],

    /*
    |--------------------------------------------------------------------------
    | Garbage Collection Threshold
    |--------------------------------------------------------------------------
    |
    | When executing long-lived PHP scripts such as Octane, memory can build
    | up before being cleared by PHP. You can force Octane to run garbage
    | collection if your application consumes this amount of megabytes.
    |
    */

    'garbage' => (int) env('OCTANE_GARBAGE_THRESHOLD_MB', 32),

    /*
    |--------------------------------------------------------------------------
    | Swoole
    |--------------------------------------------------------------------------
    |
    | php_options are passed to the PHP binary that boots the Swoole worker
    | (e.g. per-process memory_limit). See docs/octane-production.md.
    |
    */

    'swoole' => [
        'command' => env('OCTANE_SWOOLE_COMMAND', 'swoole-server'),
        'php_options' => array_values(array_filter([
            ($mem = (string) env('OCTANE_PHP_MEMORY_LIMIT', '')) !== '' ? '-dmemory_limit='.$mem : null,
        ])),
        'ssl' => ! in_array(strtolower((string) env('OCTANE_SWOOLE_SSL', 'false')), ['0', 'false', 'no', 'off'], true),
        'options' => [
            'open_http2_protocol' => ! in_array(strtolower((string) env('OCTANE_SWOOLE_HTTP2', 'false')), ['0', 'false', 'no', 'off'], true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | RoadRunner
    |--------------------------------------------------------------------------
    */

    'roadrunner' => [
        'command' => env('OCTANE_ROADRUNNER_COMMAND', 'vendor/bin/roadrunner-worker'),
        'http_middleware' => env('OCTANE_ROADRUNNER_HTTP_MIDDLEWARE', 'static'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Worker memory monitoring
    |--------------------------------------------------------------------------
    |
    | Logs warnings when RSS-style memory (true arg) exceeds memory_alert_mb.
    | Point log_channel at "stack" that includes Slack for paging on leaks.
    | sample_every_n_ops: 0 disables periodic info samples; e.g. 500 in staging.
    |
    */

    'monitoring' => [
        'enabled' => ! in_array(strtolower((string) env('OCTANE_MONITORING_ENABLED', 'true')), ['0', 'false', 'no', 'off'], true),
        'memory_alert_mb' => (float) env('OCTANE_MEMORY_ALERT_MB', 192),
        'sample_every_n_ops' => (int) env('OCTANE_METRICS_SAMPLE_EVERY_N_OPS', 0),
        'log_channel' => env('OCTANE_MONITORING_LOG_CHANNEL', 'octane'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Safeguards (uptime / load stability)
    |--------------------------------------------------------------------------
    |
    | - slow_request_ms: log octane.slow_request when wall time exceeds this.
    | - memory_hard_stop_mb: critical log + optional worker recycle (StoppableClient).
    | - memory_leak_*: consecutive-request growth heuristic → critical + recycle.
    | - ReconnectStaleServices: optional DB/Redis ping + reconnect (see env below).
    |
    */

    'safeguards' => [
        'enabled' => ! in_array(strtolower((string) env('OCTANE_SAFEGUARDS_ENABLED', 'true')), ['0', 'false', 'no', 'off'], true),
        'slow_request_ms' => (int) env('OCTANE_SLOW_REQUEST_MS', 2000),
        'memory_hard_stop_mb' => (float) env('OCTANE_MEMORY_HARD_STOP_MB', 512),
        'memory_leak_delta_mb' => (float) env('OCTANE_MEMORY_LEAK_DELTA_MB', 5),
        'memory_leak_streak' => (int) env('OCTANE_MEMORY_LEAK_STREAK', 20),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maximum Execution Time
    |--------------------------------------------------------------------------
    |
    | The following setting configures the maximum execution time for requests
    | being handled by Octane. You may set this value to 0 to indicate that
    | there isn't a specific time limit on Octane request execution time.
    |
    */

    'max_execution_time' => env('OCTANE_MAX_EXECUTION_TIME', 30),

];
