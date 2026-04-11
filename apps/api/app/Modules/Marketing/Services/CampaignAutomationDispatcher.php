<?php

namespace App\Modules\Marketing\Services;

use App\Jobs\ProcessCampaignAutomationJob;
use Illuminate\Support\Str;

/**
 * Dispatches stateless campaign automation work to the dedicated queue.
 */
final class CampaignAutomationDispatcher
{
    /**
     * @param  array<string, mixed>  $context  Must be JSON-serializable scalars only.
     */
    public function dispatchRun(string $organizationId, string $workflowId, array $context = []): string
    {
        $runId = (string) Str::ulid();
        ProcessCampaignAutomationJob::dispatch($runId, $organizationId, $workflowId, $context);

        return $runId;
    }
}
