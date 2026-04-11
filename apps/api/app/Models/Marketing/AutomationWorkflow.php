<?php

namespace App\Models\Marketing;

use App\Models\BaseTenantModel;

class AutomationWorkflow extends BaseTenantModel
{
    protected $table = 'AutomationWorkflow';

    protected $fillable = [
        'id',
        'organizationId',
        'name',
        'description',
        'type',
        'trigger',
        'actions',
        'isActive',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
}
