<?php

namespace App\Models\Content;

use App\Models\BaseTenantModel;

class ContentItem extends BaseTenantModel
{
    protected $table = 'Content';

    protected $fillable = [
        'id',
        'organizationId',
        'type',
        'title',
        'description',
        'slug',
        'content',
        'creatorId',
        'status',
        'tags',
        'thumbnail',
        'views',
        'likes',
        'publishedAt',
        'scheduledAt',
        'expiresAt',
    ];

    protected $casts = [
        'tags' => 'array',
        'views' => 'integer',
        'likes' => 'integer',
        'publishedAt' => 'datetime',
        'scheduledAt' => 'datetime',
        'expiresAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
}
