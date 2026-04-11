<?php

namespace App\Modules\Video\Controllers;

use App\Http\Controllers\BaseController;
use App\Jobs\RenderVideoJob;
use App\Models\Video\VideoProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class VideoProjectController extends BaseController
{
    public function index(Request $request)
    {
        $tenant = $this->tenant($request);
        $items = VideoProject::query()->where('organizationId', $tenant)->orderByDesc('updatedAt')->limit(100)->get();

        return $this->ok(['items' => $items]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $row = VideoProject::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $this->tenant($request),
            'createdById' => $user->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => 'DRAFT',
        ]);

        return $this->ok($row, 'Created', 201);
    }

    public function render(Request $request, string $id)
    {
        VideoProject::query()->where('organizationId', $this->tenant($request))->where('id', $id)->firstOrFail();
        $jobId = (string) Str::ulid();
        Cache::put('video_job:'.$jobId, ['status' => 'queued', 'projectId' => $id], now()->addHours(6));
        RenderVideoJob::dispatch($jobId, $id);

        return response()->json([
            'success' => true,
            'data' => ['jobId' => $jobId, 'status' => 'queued'],
            'message' => 'Render queued',
        ], 202);
    }

    public function jobStatus(Request $request, string $jobId)
    {
        return $this->ok(Cache::get('video_job:'.$jobId, ['status' => 'unknown']));
    }

    private function tenant(Request $request): string
    {
        $id = $request->attributes->get('tenant_id');
        abort_if(! is_string($id) || $id === '', 400, 'X-Tenant-ID header is required');

        return $id;
    }
}
