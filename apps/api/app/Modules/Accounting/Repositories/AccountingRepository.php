<?php

namespace App\Modules\Accounting\Repositories;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\Payment;
use App\Models\Accounting\Subscription;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AccountingRepository
{
    public function paginatedSubscriptions(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return Subscription::query()
            ->where('organizationId', $tenantId)
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }

    public function paginatedInvoices(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return Invoice::query()
            ->whereHas('subscription', fn ($q) => $q->where('organizationId', $tenantId))
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }

    public function paginatedPayments(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return Payment::query()
            ->whereHas('subscription', fn ($q) => $q->where('organizationId', $tenantId))
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }
}

