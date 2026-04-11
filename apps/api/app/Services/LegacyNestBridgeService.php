<?php

namespace App\Services;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

class LegacyNestBridgeService
{
    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, string>  $headers
     * @return array{status: int, body: mixed}
     */
    public function forward(string $path, array $payload = [], array $headers = []): array
    {
        $baseUrl = rtrim((string) config('services.nest_backend.url'), '/');
        if ($baseUrl === '') {
            throw new RuntimeException('Legacy Nest backend URL is not configured');
        }

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('nest')
                ->withHeaders($headers)
                ->post($baseUrl.'/'.ltrim($path, '/'), $payload));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Legacy backend unreachable: '.$e->getMessage(), 0, $e);
        }

        return [
            'status' => $response->status(),
            'body' => $response->json() ?? ['raw' => $response->body()],
        ];
    }
}
