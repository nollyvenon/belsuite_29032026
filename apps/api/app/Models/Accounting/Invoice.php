<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $table = 'Invoice';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'subscriptionId',
        'billingProfileId',
        'amount',
        'currency',
        'status',
        'issuedAt',
        'dueAt',
        'paidAt',
        'pdfUrl',
    ];

    protected $casts = [
        'amount' => 'float',
        'issuedAt' => 'datetime',
        'dueAt' => 'datetime',
        'paidAt' => 'datetime',
        'createdAt' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscriptionId');
    }
}

