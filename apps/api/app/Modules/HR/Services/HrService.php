<?php

namespace App\Modules\HR\Services;

use App\Modules\HR\Repositories\HrRepository;

class HrService
{
    public function __construct(private readonly HrRepository $repository)
    {
    }

    public function teams(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedTeams($tenantId, $perPage);
        return $this->paginatedPayload($result);
    }

    public function members(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedTeamMembers($tenantId, $perPage);
        return $this->paginatedPayload($result);
    }

    private function paginatedPayload($paginator): array
    {
        return [
            'items' => $paginator->items(),
            'page' => $paginator->currentPage(),
            'limit' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}

