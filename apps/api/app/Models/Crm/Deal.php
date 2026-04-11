<?php

namespace App\Models\Crm;

use App\Models\BaseTenantModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deal extends BaseTenantModel
{
    protected $table = 'Deal';

    protected $fillable = [
        'id',
        'organizationId',
        'userId',
        'title',
        'contactEmail',
        'contactName',
        'companyName',
        'stage',
        'priority',
        'value',
        'currency',
        'probability',
        'expectedCloseAt',
        'closedAt',
        'ownerId',
        'sourceLeadId',
        'pipelineName',
        'lostReason',
        'tags',
        'notes',
        'aiScore',
        'aiNotes',
        'properties',
    ];

    protected $casts = [
        'value' => 'float',
        'expectedCloseAt' => 'datetime',
        'closedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function activities(): HasMany
    {
        return $this->hasMany(ContactActivity::class, 'dealId');
    }
}
