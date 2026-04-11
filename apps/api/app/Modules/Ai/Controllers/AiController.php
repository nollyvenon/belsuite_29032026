<?php

namespace App\Modules\Ai\Controllers;

use App\Http\Controllers\BaseController;
use App\Jobs\GenerateAiContentJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AiController extends BaseController
{
    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => ['required', 'string', 'max:16000'],
            'async' => ['sometimes', 'boolean'],
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        abort_if(! is_string($tenantId) || $tenantId === '', 400, 'X-Tenant-ID header is required');

        $prompt = (string) $request->input('prompt');
        $asyncDefault = (bool) config('ai.async_default', true);
        $minLen = (int) config('ai.async_prompt_min_length', 400);
        $async = (bool) $request->boolean('async', $asyncDefault || mb_strlen($prompt) >= $minLen);

        if ($async) {
            $jobId = (string) Str::ulid();
            Cache::put('ai_job:'.$jobId, ['status' => 'queued', 'queuedAt' => now()->toIso8601String()], now()->addHour());
            GenerateAiContentJob::dispatch($jobId, $tenantId, $prompt);

            return response()->json([
                'success' => true,
                'data' => ['jobId' => $jobId, 'status' => 'queued'],
                'message' => 'Generation queued',
            ], 202);
        }

        $ttl = (int) config('ai.response_cache_ttl', 0);
        $cacheKey = 'ai:sync:'.sha1($tenantId."\n".$prompt);
        if ($ttl > 0) {
            $body = Cache::remember($cacheKey, $ttl, fn (): array => [
                'text' => 'Sync placeholder: '.mb_substr($prompt, 0, 500),
                'model' => $request->input('model', 'stub'),
            ]);

            return $this->ok($body);
        }

        return $this->ok([
            'text' => 'Sync placeholder: '.mb_substr($prompt, 0, 500),
            'model' => $request->input('model', 'stub'),
        ]);
    }

    public function jobStatus(Request $request, string $jobId)
    {
        $payload = Cache::get('ai_job:'.$jobId, ['status' => 'unknown']);

        return $this->ok($payload);
    }
}
