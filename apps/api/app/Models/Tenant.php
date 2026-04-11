<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Organization / tenant root — must not use BelongsToTenant (no self-scope).
 */
class Tenant extends Model
{
    protected $table = 'Organization';

    public $incrementing = false;

    protected $keyType = 'string';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'email',
        'description',
        'status',
        'isActive',
        'tier',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(\App\Models\Accounting\Subscription::class, 'organizationId');
    }
}
