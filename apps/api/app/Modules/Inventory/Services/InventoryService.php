<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Repositories\InventoryRepository;

class InventoryService
{
    public function __construct(private readonly InventoryRepository $repository)
    {
    }

    public function assets(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedAssets($tenantId, $perPage);
        return [
            'items' => $result->items(),
            'page' => $result->currentPage(),
            'limit' => $result->perPage(),
            'total' => $result->total(),
        ];
    }
}

