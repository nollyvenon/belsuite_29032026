<?php

namespace App\Models\Hr;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMember extends Model
{
    protected $table = 'TeamMember';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'teamId',
        'userId',
        'role',
        'isActive',
        'joinedAt',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'joinedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'teamId');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId');
    }
}

