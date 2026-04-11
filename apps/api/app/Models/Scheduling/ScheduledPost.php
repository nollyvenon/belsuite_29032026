<?php

namespace App\Models\Scheduling;

use App\Models\BaseTenantModel;

class ScheduledPost extends BaseTenantModel
{
    protected $table = 'ScheduledPost';

    protected $fillable = [
        'id',
        'organizationId',
        'createdById',
        'content',
        'mediaUrls',
        'mediaKeys',
        'link',
        'hashtags',
        'status',
        'scheduledAt',
        'publishedAt',
        'aiGenerated',
        'aiPrompt',
    ];

    protected $casts = [
        'mediaUrls' => 'array',
        'mediaKeys' => 'array',
        'hashtags' => 'array',
        'aiGenerated' => 'boolean',
        'optimalTimeUsed' => 'boolean',
        'autoRepostEnabled' => 'boolean',
        'scheduledAt' => 'datetime',
        'publishedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
}
