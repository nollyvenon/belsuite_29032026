<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\Accounting\Services\AccountingService;
use Illuminate\Http\Request;

class AccountingController extends BaseController
{
    public function __construct(private readonly AccountingService $service)
    {
    }

    public function subscriptions(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->subscriptions($tenantId, $limit));
    }

    public function invoices(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->invoices($tenantId, $limit));
    }

    public function payments(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->payments($tenantId, $limit));
    }
}

