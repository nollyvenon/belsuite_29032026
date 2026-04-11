<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\Crm\Services\CrmDealsService;
use Illuminate\Http\Request;

class CrmDealsController extends BaseController
{
    public function __construct(private readonly CrmDealsService $deals)
    {
    }

    public function store(Request $request)
    {
        $tenantId = $this->requireTenant($request);
        $user = $request->user();

        return $this->ok($this->deals->createDeal($tenantId, $user->id, $request->all()));
    }

    public function index(Request $request)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->listDeals($tenantId, $request->query()));
    }

    public function board(Request $request)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->getBoardView($tenantId));
    }

    public function stats(Request $request)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->getDealStats($tenantId));
    }

    public function timeline(Request $request, string $email)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->getContactTimeline($tenantId, rawurldecode($email)));
    }

    public function show(Request $request, string $id)
    {
        $tenantId = $this->requireTenant($request);
        $deal = $this->deals->getDeal($tenantId, $id);
        if (! $deal) {
            return $this->fail('Not found', [], 404);
        }

        return $this->ok($deal);
    }

    public function update(Request $request, string $id)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->updateDeal($tenantId, $id, $request->all()));
    }

    public function destroy(Request $request, string $id)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->deleteDeal($tenantId, $id));
    }

    public function aiScore(Request $request, string $id)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->aiScoreDeal($tenantId, $id));
    }

    public function addActivity(Request $request)
    {
        $tenantId = $this->requireTenant($request);

        return $this->ok($this->deals->addActivity($tenantId, $request->all()));
    }

    private function requireTenant(Request $request): string
    {
        $id = $request->attributes->get('tenant_id');
        if (! is_string($id) || $id === '') {
            abort(400, 'X-Tenant-ID header is required');
        }

        return $id;
    }
}
