<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * Serializable route target for `/api/v1/health` (supports `php artisan route:cache` / Octane).
 */
final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $ttl = (int) config('performance.health_cache_ttl', 5);
        $payload = $ttl > 0
            ? Cache::remember('api:v1:health', $ttl, static fn (): array => [
                'success' => true,
                'data' => ['status' => 'ok'],
                'message' => 'API is healthy',
            ])
            : [
                'success' => true,
                'data' => ['status' => 'ok'],
                'message' => 'API is healthy',
            ];

        return response()->json($payload);
    }
}
