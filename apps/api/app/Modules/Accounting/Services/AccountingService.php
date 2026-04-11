<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Repositories\AccountingRepository;

class AccountingService
{
    public function __construct(private readonly AccountingRepository $repository)
    {
    }

    public function subscriptions(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedSubscriptions($tenantId, $perPage);
        return $this->paginatedPayload($result);
    }

    public function invoices(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedInvoices($tenantId, $perPage);
        return $this->paginatedPayload($result);
    }

    public function payments(string $tenantId, int $perPage = 20): array
    {
        $result = $this->repository->paginatedPayments($tenantId, $perPage);
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

