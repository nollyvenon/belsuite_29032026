<?php

namespace App\Modules\Marketing\Controllers;

use App\Http\Controllers\BaseController;
use App\Models\Marketing\AutomationWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AutomationWorkflowController extends BaseController
{
    public function index(Request $request)
    {
        $items = AutomationWorkflow::query()
            ->where('organizationId', $this->tenant($request))
            ->orderByDesc('updatedAt')
            ->limit(200)
            ->get();

        return $this->ok(['items' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:64'],
            'trigger' => ['nullable', 'string'],
            'actions' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
        ]);
        $row = AutomationWorkflow::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $this->tenant($request),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? null,
            'trigger' => $data['trigger'] ?? null,
            'actions' => $data['actions'] ?? null,
            'isActive' => $data['isActive'] ?? false,
        ]);

        return $this->ok($row, 'Created', 201);
    }

    public function update(Request $request, string $id)
    {
        $row = AutomationWorkflow::query()
            ->where('organizationId', $this->tenant($request))
            ->where('id', $id)
            ->firstOrFail();
        $row->fill($request->only(['name', 'description', 'type', 'trigger', 'actions', 'isActive']))->save();

        return $this->ok($row->fresh());
    }

    public function webhook(Request $request)
    {
        $token = (string) $request->query('token', '');
        $expected = (string) config('services.marketing_webhook_token', '');
        if ($expected !== '' && ! hash_equals($expected, $token)) {
            return $this->fail('Invalid signature', [], 401);
        }

        return $this->ok(['received' => true]);
    }

    private function tenant(Request $request): string
    {
        $id = $request->attributes->get('tenant_id');
        abort_if(! is_string($id) || $id === '', 400, 'X-Tenant-ID header is required');

        return $id;
    }
}
