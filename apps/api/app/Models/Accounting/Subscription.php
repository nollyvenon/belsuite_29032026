<?php

namespace App\Models\Accounting;

use App\Models\BaseTenantModel;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends BaseTenantModel
{
    protected $table = 'Subscription';

    protected $fillable = [
        'organizationId',
        'planId',
        'status',
        'currentPeriodStart',
        'currentPeriodEnd',
        'cancelledAt',
        'primaryPaymentMethod',
    ];

    protected $casts = [
        'currentPeriodStart' => 'datetime',
        'currentPeriodEnd' => 'datetime',
        'cancelledAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'organizationId');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'subscriptionId');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'subscriptionId');
    }
}

