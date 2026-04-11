<?php

namespace App\Modules\Crm\Services;

use App\Models\Crm\ContactActivity;
use App\Models\Crm\Deal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CrmDealsService
{
    /** @var list<string> */
    private const STAGE_ORDER = [
        'PROSPECTING',
        'QUALIFIED',
        'PROPOSAL',
        'NEGOTIATION',
        'CLOSED_WON',
        'CLOSED_LOST',
    ];

    /** @var list<string> */
    private const LIST_COLUMNS = [
        'id', 'organizationId', 'userId', 'title', 'contactEmail', 'contactName', 'companyName',
        'stage', 'priority', 'value', 'currency', 'probability', 'expectedCloseAt', 'closedAt',
        'ownerId', 'pipelineName', 'aiScore', 'createdAt', 'updatedAt',
    ];

    /**
     * @param  array<string, mixed>  $dto
     */
    public function createDeal(string $organizationId, string $userId, array $dto): Deal
    {
        $deal = Deal::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $organizationId,
            'userId' => $userId,
            'title' => (string) $dto['title'],
            'contactEmail' => $dto['contactEmail'] ?? null,
            'contactName' => $dto['contactName'] ?? null,
            'companyName' => $dto['companyName'] ?? null,
            'stage' => $dto['stage'] ?? 'PROSPECTING',
            'priority' => $dto['priority'] ?? 'MEDIUM',
            'value' => isset($dto['value']) ? (float) $dto['value'] : 0,
            'currency' => $dto['currency'] ?? 'USD',
            'probability' => isset($dto['probability']) ? (int) $dto['probability'] : 20,
            'expectedCloseAt' => $dto['expectedCloseAt'] ?? null,
            'ownerId' => $dto['ownerId'] ?? $userId,
            'pipelineName' => $dto['pipelineName'] ?? 'Sales',
            'sourceLeadId' => $dto['sourceLeadId'] ?? null,
            'notes' => $dto['notes'] ?? null,
            'tags' => isset($dto['tags']) && is_array($dto['tags']) ? json_encode($dto['tags']) : null,
            'properties' => isset($dto['properties']) ? json_encode($dto['properties']) : '',
        ]);

        $this->logActivity($organizationId, [
            'contactEmail' => $dto['contactEmail'] ?? '',
            'contactName' => $dto['contactName'] ?? null,
            'activityType' => 'DEAL_CREATED',
            'dealId' => $deal->id,
            'subject' => 'Deal "'.((string) $dto['title']).'" created',
        ]);

        $this->forgetCrmReadCache($organizationId);

        return $deal->fresh();
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array{items: \Illuminate\Support\Collection<int, Deal>, total: int, page: int, limit: int}
     */
    public function listDeals(string $organizationId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = min(100, max(1, (int) ($query['limit'] ?? 20)));
        $q = Deal::query()
            ->where('organizationId', $organizationId)
            ->select(self::LIST_COLUMNS);
        if (! empty($query['stage'])) {
            $q->where('stage', (string) $query['stage']);
        }
        if (! empty($query['ownerId'])) {
            $q->where('ownerId', (string) $query['ownerId']);
        }
        $total = (clone $q)->count();
        $items = $q->orderByDesc('updatedAt')->forPage($page, $limit)->get();

        return ['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function getDeal(string $organizationId, string $dealId): ?Deal
    {
        return Deal::query()
            ->where('organizationId', $organizationId)
            ->where('id', $dealId)
            ->with(['activities' => fn ($q) => $q->orderByDesc('createdAt')->limit(50)])
            ->first();
    }

    /**
     * @param  array<string, mixed>  $dto
     */
    public function updateDeal(string $organizationId, string $dealId, array $dto): Deal
    {
        $current = Deal::query()->where('organizationId', $organizationId)->where('id', $dealId)->firstOrFail();
        $previousStage = $current->stage;
        $data = [];
        foreach ([
            'title', 'stage', 'priority', 'value', 'probability', 'expectedCloseAt', 'closedAt',
            'lostReason', 'notes', 'ownerId', 'contactEmail', 'contactName', 'companyName',
        ] as $k) {
            if (array_key_exists($k, $dto)) {
                $data[$k] = $dto[$k];
            }
        }
        if ($data !== []) {
            $current->fill($data)->save();
        }
        if (isset($dto['stage']) && $previousStage !== $dto['stage']) {
            $fresh = $current->fresh();
            $this->logActivity($organizationId, [
                'contactEmail' => (string) ($fresh?->contactEmail ?? ''),
                'contactName' => $fresh?->contactName,
                'activityType' => 'DEAL_STAGE_CHANGED',
                'dealId' => $dealId,
                'subject' => 'Stage changed: '.$previousStage.' → '.$dto['stage'],
            ]);
        }

        $this->forgetCrmReadCache($organizationId);

        return $current->fresh();
    }

    public function deleteDeal(string $organizationId, string $dealId): array
    {
        Deal::query()->where('organizationId', $organizationId)->where('id', $dealId)->delete();
        $this->forgetCrmReadCache($organizationId);

        return ['deleted' => true];
    }

    /**
     * @return array{board: array<string, list<Deal>>, totals: list<array{stage: string, count: int, value: float}>}
     */
    public function getBoardView(string $organizationId): array
    {
        $ttl = (int) config('crm.board_cache_ttl', 0);
        if ($ttl > 0) {
            return Cache::remember(
                "crm:board:{$organizationId}",
                $ttl,
                fn (): array => $this->buildBoardView($organizationId),
            );
        }

        return $this->buildBoardView($organizationId);
    }

    /**
     * @return array{board: array<string, list<Deal>>, totals: list<array{stage: string, count: int, value: float}>}
     */
    private function buildBoardView(string $organizationId): array
    {
        $deals = Deal::query()
            ->where('organizationId', $organizationId)
            ->select(self::LIST_COLUMNS)
            ->orderByDesc('updatedAt')
            ->get();
        /** @var array<string, list<Deal>> $board */
        $board = [];
        foreach (self::STAGE_ORDER as $stage) {
            $board[$stage] = [];
        }
        foreach ($deals as $deal) {
            $stage = in_array($deal->stage, self::STAGE_ORDER, true) ? $deal->stage : 'PROSPECTING';
            $board[$stage][] = $deal;
        }
        $totals = [];
        foreach (self::STAGE_ORDER as $stage) {
            $list = $board[$stage];
            $totals[] = [
                'stage' => $stage,
                'count' => count($list),
                'value' => round(array_reduce($list, fn (float $s, Deal $d) => $s + (float) $d->value, 0.0), 2),
            ];
        }

        return ['board' => $board, 'totals' => $totals];
    }

    /**
     * @return array<string, mixed>
     */
    public function getContactTimeline(string $organizationId, string $contactEmail): array
    {
        $activities = ContactActivity::query()
            ->where('organizationId', $organizationId)
            ->where('contactEmail', $contactEmail)
            ->orderByDesc('createdAt')
            ->limit(200)
            ->get();
        $deals = Deal::query()
            ->where('organizationId', $organizationId)
            ->where('contactEmail', $contactEmail)
            ->orderByDesc('updatedAt')
            ->get();
        $totalDealValue = $deals->sum(fn (Deal $d) => (float) $d->value);
        $wonValue = $deals->where('stage', 'CLOSED_WON')->sum(fn (Deal $d) => (float) $d->value);

        return [
            'contactEmail' => $contactEmail,
            'summary' => [
                'totalActivities' => $activities->count(),
                'totalDeals' => $deals->count(),
                'wonDeals' => $deals->where('stage', 'CLOSED_WON')->count(),
                'totalDealValue' => round($totalDealValue, 2),
                'wonDealValue' => round($wonValue, 2),
            ],
            'activities' => $activities,
            'deals' => $deals,
        ];
    }

    /**
     * @return array{dealId: string, score: int, reasoning: string, nextBestAction: string}
     */
    public function aiScoreDeal(string $organizationId, string $dealId): array
    {
        $deal = Deal::query()->where('organizationId', $organizationId)->where('id', $dealId)->firstOrFail();
        $score = (int) $deal->probability;
        $reasoning = 'Based on stage and probability.';
        $nextBestAction = 'Follow up with decision maker.';
        $deal->forceFill([
            'aiScore' => $score,
            'aiNotes' => $reasoning.' | Next: '.$nextBestAction,
        ])->save();
        $this->forgetCrmReadCache($organizationId);

        return [
            'dealId' => $dealId,
            'score' => $score,
            'reasoning' => $reasoning,
            'nextBestAction' => $nextBestAction,
        ];
    }

    /**
     * @param  array<string, mixed>  $dto
     */
    public function addActivity(string $organizationId, array $dto): ContactActivity
    {
        $row = $this->logActivity($organizationId, $dto);
        $this->forgetCrmReadCache($organizationId);

        return $row;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function logActivity(string $organizationId, array $data): ContactActivity
    {
        return ContactActivity::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $organizationId,
            'contactEmail' => (string) ($data['contactEmail'] ?? ''),
            'contactName' => $data['contactName'] ?? null,
            'activityType' => (string) ($data['activityType'] ?? 'NOTE'),
            'dealId' => $data['dealId'] ?? null,
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'] ?? null,
            'performedBy' => $data['performedBy'] ?? null,
        ]);
    }

    /**
     * @return array<string, int|float>
     */
    public function getDealStats(string $organizationId): array
    {
        $ttl = (int) config('crm.stats_cache_ttl', 0);
        if ($ttl > 0) {
            return Cache::remember(
                "crm:stats:{$organizationId}",
                $ttl,
                fn (): array => $this->computeDealStats($organizationId),
            );
        }

        return $this->computeDealStats($organizationId);
    }

    /**
     * @return array<string, int|float>
     */
    private function computeDealStats(string $organizationId): array
    {
        $monthStart = now()->startOfMonth();
        $base = Deal::query()->where('organizationId', $organizationId);

        $perStage = (clone $base)
            ->selectRaw('stage, COUNT(*) as cnt, COALESCE(SUM(value), 0) as sum_val')
            ->groupBy('stage')
            ->get()
            ->keyBy('stage');

        $total = (int) $perStage->sum('cnt');
        $wonCount = (int) ($perStage->get('CLOSED_WON')?->cnt ?? 0);
        $lostCount = (int) ($perStage->get('CLOSED_LOST')?->cnt ?? 0);
        $wonValue = (float) ($perStage->get('CLOSED_WON')?->sum_val ?? 0);

        $openCount = 0;
        $pipelineValue = 0.0;
        foreach ($perStage as $stage => $row) {
            if (! in_array($stage, ['CLOSED_WON', 'CLOSED_LOST'], true)) {
                $openCount += (int) $row->cnt;
                $pipelineValue += (float) $row->sum_val;
            }
        }

        $newThisMonth = (clone $base)->where('createdAt', '>=', $monthStart)->count();

        return [
            'total' => $total,
            'openDeals' => $openCount,
            'wonDeals' => $wonCount,
            'lostDeals' => $lostCount,
            'pipelineValue' => round($pipelineValue, 2),
            'wonValue' => round($wonValue, 2),
            'winRate' => $total > 0 ? round(($wonCount / $total) * 100, 2) : 0,
            'newThisMonth' => $newThisMonth,
            'avgDealValue' => $wonCount > 0 ? round($wonValue / $wonCount, 2) : 0,
        ];
    }

    private function forgetCrmReadCache(string $organizationId): void
    {
        Cache::forget("crm:board:{$organizationId}");
        Cache::forget("crm:stats:{$organizationId}");
    }
}
