<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceRbac
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', [], 401);
        }

        if (!method_exists($user, 'hasAnyRole') || !empty($roles) && !$user->hasAnyRole($roles)) {
            return ApiResponse::error('Forbidden', [], 403);
        }

        return $next($request);
    }
}

