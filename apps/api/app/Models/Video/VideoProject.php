<?php

namespace App\Models\Video;

use App\Models\BaseTenantModel;

class VideoProject extends BaseTenantModel
{
    protected $table = 'VideoProject';

    protected $fillable = [
        'id',
        'organizationId',
        'createdById',
        'title',
        'status',
        'description',
    ];

    protected $casts = [
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
}
