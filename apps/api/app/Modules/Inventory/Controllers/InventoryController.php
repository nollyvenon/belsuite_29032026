<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends BaseController
{
    public function __construct(private readonly InventoryService $service)
    {
    }

    public function assets(Request $request)
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        if ($tenantId === '') {
            return $this->fail('Tenant context is required', [], 422);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));
        return $this->ok($this->service->assets($tenantId, $limit));
    }
}

