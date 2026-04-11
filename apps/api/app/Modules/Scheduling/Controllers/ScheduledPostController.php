<?php

namespace App\Modules\Scheduling\Controllers;

use App\Http\Controllers\BaseController;
use App\Models\Scheduling\ScheduledPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScheduledPostController extends BaseController
{
    public function index(Request $request)
    {
        $tenant = $this->tenant($request);
        $items = ScheduledPost::query()->where('organizationId', $tenant)->orderByDesc('scheduledAt')->limit(100)->get();

        return $this->ok(['items' => $items]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'content' => ['required', 'string'],
            'scheduledAt' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'hashtags' => ['nullable', 'array'],
            'mediaUrls' => ['nullable', 'array'],
        ]);
        $row = ScheduledPost::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $this->tenant($request),
            'createdById' => $user->id,
            'content' => $data['content'],
            'scheduledAt' => $data['scheduledAt'] ?? null,
            'status' => $data['status'] ?? 'DRAFT',
            'hashtags' => $data['hashtags'] ?? null,
            'mediaUrls' => $data['mediaUrls'] ?? null,
        ]);

        return $this->ok($row, 'Scheduled', 201);
    }

    public function update(Request $request, string $id)
    {
        $row = ScheduledPost::query()->where('organizationId', $this->tenant($request))->where('id', $id)->firstOrFail();
        $row->fill($request->only(['content', 'scheduledAt', 'status', 'hashtags', 'mediaUrls']))->save();

        return $this->ok($row->fresh());
    }

    public function destroy(Request $request, string $id)
    {
        ScheduledPost::query()->where('organizationId', $this->tenant($request))->where('id', $id)->delete();

        return $this->ok(['deleted' => true]);
    }

    private function tenant(Request $request): string
    {
        $id = $request->attributes->get('tenant_id');
        abort_if(! is_string($id) || $id === '', 400, 'X-Tenant-ID header is required');

        return $id;
    }
}
