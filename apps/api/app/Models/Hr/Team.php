<?php

namespace App\Models\Hr;

use App\Models\BaseTenantModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends BaseTenantModel
{
    protected $table = 'Team';

    protected $fillable = [
        'organizationId',
        'name',
        'slug',
        'description',
        'isPublic',
        'requiresApproval',
        'memberCount',
        'maxMembers',
        'createdById',
    ];

    protected $casts = [
        'isPublic' => 'boolean',
        'requiresApproval' => 'boolean',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
        'archivedAt' => 'datetime',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'createdById');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'teamId');
    }
}

