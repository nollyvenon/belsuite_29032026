<?php

namespace App\Models\Crm;

use App\Models\BaseTenantModel;

class ContactActivity extends BaseTenantModel
{
    protected $table = 'ContactActivity';

    public const UPDATED_AT = null;

    protected $fillable = [
        'organizationId',
        'contactEmail',
        'contactName',
        'activityType',
        'dealId',
        'subject',
        'body',
        'metadata',
        'performedBy',
    ];

    protected $casts = [
        'createdAt' => 'datetime',
    ];
}
