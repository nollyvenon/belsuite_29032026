<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

abstract class BaseTenantModel extends Model
{
    use BelongsToTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected string $tenantColumn = 'organizationId';

    public function tenantColumn(): string
    {
        return $this->tenantColumn;
    }
}

