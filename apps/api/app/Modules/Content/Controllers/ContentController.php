<?php

namespace App\Modules\Content\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\Content\Services\ContentService;
use Illuminate\Http\Request;

class ContentController extends BaseController
{
    public function __construct(private readonly ContentService $content)
    {
    }

    public function index(Request $request)
    {
        return $this->ok($this->content->list($this->tenant($request), $request->query()));
    }

    public function store(Request $request)
    {
        $user = $request->user();

        return $this->ok($this->content->create($this->tenant($request), $user->id, $request->all()), 'Created', 201);
    }

    public function show(Request $request, string $id)
    {
        $item = $this->content->find($this->tenant($request), $id);
        if (! $item) {
            return $this->fail('Not found', [], 404);
        }

        return $this->ok($item);
    }

    public function update(Request $request, string $id)
    {
        $item = $this->content->find($this->tenant($request), $id);
        if (! $item) {
            return $this->fail('Not found', [], 404);
        }

        return $this->ok($this->content->update($item, $request->all()));
    }

    public function destroy(Request $request, string $id)
    {
        $item = $this->content->find($this->tenant($request), $id);
        if (! $item) {
            return $this->fail('Not found', [], 404);
        }
        $this->content->delete($item);

        return $this->ok(['deleted' => true]);
    }

    private function tenant(Request $request): string
    {
        $id = $request->attributes->get('tenant_id');
        abort_if(! is_string($id) || $id === '', 400, 'X-Tenant-ID header is required');

        return $id;
    }
}
