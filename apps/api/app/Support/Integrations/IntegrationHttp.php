<?php

namespace App\Support\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Stateless HTTP factory for third-party integrations.
 *
 * Returns a new {@see PendingRequest} per call — no shared sockets or mutable
 * client state on singletons, which keeps behavior predictable under Octane.
 */
final class IntegrationHttp
{
    /**
     * @param  array{
     *     timeout?: int,
     *     connect_timeout?: int,
     *     retries?: int,
     *     retry_sleep_ms?: int,
     *     connection_close?: bool
     * }  $overrides
     */
    public static function profile(string $name, array $overrides = []): PendingRequest
    {
        /** @var array<string, mixed> $cfg */
        $cfg = array_merge(
            (array) config("integrations.http.{$name}", []),
            $overrides,
        );

        $timeout = (int) ($cfg['timeout'] ?? 15);
        $connectTimeout = (int) ($cfg['connect_timeout'] ?? 5);
        $retries = max(0, (int) ($cfg['retries'] ?? 0));
        $retrySleepMs = max(0, (int) ($cfg['retry_sleep_ms'] ?? 200));
        $connectionClose = (bool) ($cfg['connection_close'] ?? true);

        $request = Http::acceptJson()
            ->timeout($timeout)
            ->connectTimeout($connectTimeout);

        if ($connectionClose) {
            $request = $request->withHeaders(['Connection' => 'close']);
        }

        if ($retries > 0) {
            $request = $request->retry($retries, $retrySleepMs, null, false);
        }

        return $request;
    }

    /**
     * One immediate retry on transport failure (stale connection / TLS blip).
     * Does not retry HTTP 4xx/5xx — only {@see ConnectionException}.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public static function withConnectionRefresh(callable $callback): mixed
    {
        try {
            return $callback();
        } catch (ConnectionException $e) {
            $delay = (int) config('integrations.connection_retry_usleep', 150_000);
            if ($delay > 0) {
                usleep($delay);
            }

            return $callback();
        }
    }
}
