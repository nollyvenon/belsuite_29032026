<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            $tenantId = request()?->attributes->get('tenant_id');
            if (! is_string($tenantId) || $tenantId === '') {
                return;
            }

            $model = $builder->getModel();
            $column = method_exists($model, 'tenantColumn')
                ? $model->tenantColumn()
                : 'organizationId';

            $builder->where($model->getTable().'.'.$column, $tenantId);
        });
    }
}

