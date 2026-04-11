<?php

namespace App\Models\Inventory;

use App\Models\BaseTenantModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaAsset extends BaseTenantModel
{
    protected $table = 'MediaAsset';

    protected $fillable = [
        'organizationId',
        'uploadedById',
        'videoProjectId',
        'name',
        'mediaType',
        'mimeType',
        'storageKey',
        'publicUrl',
        'fileSizeBytes',
        'durationMs',
        'width',
        'height',
        'aiGenerated',
        'aiPrompt',
    ];

    protected $casts = [
        'aiGenerated' => 'boolean',
        'createdAt' => 'datetime',
    ];

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploadedById');
    }
}

