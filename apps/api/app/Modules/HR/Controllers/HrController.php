<?php

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\HR\Services\HrService;
use Illuminate\Http\Request;

class HrController extends BaseController
{
    public function __construct(private readonly HrService $service)
    {
    }

    public function teams(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->teams($tenantId, $limit));
    }

    public function members(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->members($tenantId, $limit));
    }
}

