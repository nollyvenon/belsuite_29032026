<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = (string) config('tenancy.header', 'X-Tenant-ID');
        $queryKey = (string) config('tenancy.query_key', 'tenant_id');

        $tenantId = $request->header($header)
            ?: $request->query($queryKey)
            ?: data_get($request->user(), 'tenant_id')
            ?: data_get($request->user(), 'organization_id');

        if ($tenantId !== null && $tenantId !== '') {
            $request->attributes->set('tenant_id', (string) $tenantId);
        }

        return $next($request);
    }
}

