<?php

namespace App\Support;

/**
 * Stateless accessor for per-request attributes (Octane / Swoole safe).
 * Never store tenant or correlation values on this object.
 */
final class CurrentRequestContext
{
    public function tenantId(): ?string
    {
        $v = request()?->attributes->get('tenant_id');

        return is_string($v) && $v !== '' ? $v : null;
    }

    public function correlationId(): ?string
    {
        $v = request()?->attributes->get('correlation_id');

        return is_string($v) && $v !== '' ? $v : null;
    }
}
