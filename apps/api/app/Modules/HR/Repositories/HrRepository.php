<?php

namespace App\Modules\HR\Repositories;

use App\Models\Hr\Team;
use App\Models\Hr\TeamMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HrRepository
{
    public function paginatedTeams(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return Team::query()
            ->where('organizationId', $tenantId)
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }

    public function paginatedTeamMembers(string $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return TeamMember::query()
            ->whereHas('team', fn ($q) => $q->where('organizationId', $tenantId))
            ->orderByDesc('createdAt')
            ->paginate($perPage);
    }
}

