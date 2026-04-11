<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'Payment';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'subscriptionId',
        'invoiceId',
        'provider',
        'externalPaymentId',
        'amount',
        'currency',
        'status',
        'providerResponse',
        'attemptNumber',
        'maxRetries',
        'nextRetryAt',
        'failureReason',
        'refundedAmount',
        'paidAt',
    ];

    protected $casts = [
        'amount' => 'float',
        'refundedAmount' => 'float',
        'nextRetryAt' => 'datetime',
        'paidAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscriptionId');
    }
}

