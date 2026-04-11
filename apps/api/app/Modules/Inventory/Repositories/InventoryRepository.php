<?php

namespace App\Modules\Inventory\Repositories;

use App\Models\Inventory\MediaAsset;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InventoryRepository
{
    public function paginatedAssets(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return MediaAsset::query()
            ->where('organizationId', $tenantId)
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }
}

