<?php

namespace App\Modules\Auth\Controllers;

use App\DTOs\Auth\LoginRequest;
use App\DTOs\Auth\RefreshTokenRequest;
use App\DTOs\Auth\RegisterRequest;
use App\Http\Controllers\BaseController;
use App\Modules\Auth\Support\AuthUserResource;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends BaseController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(RegisterRequest $request)
    {
        return $this->ok(
            $this->authService->register($request->validated()),
            'Registered successfully',
            201,
        );
    }

    public function login(LoginRequest $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $payload = $request->validated();

        return $this->ok(
            $this->authService->login($payload, is_string($tenantId) ? $tenantId : null),
            'Login successful',
        );
    }

    public function refresh(RefreshTokenRequest $request)
    {
        return $this->ok(
            $this->authService->refresh((string) $request->validated('refreshToken')),
            'Token refreshed',
        );
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('Unauthenticated', [], 401);
        }

        $orgId = $this->authService->primaryOrganizationIdForUser($user->id);

        return $this->ok([
            'user' => AuthUserResource::toArray($user),
            'organizationId' => $orgId,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $this->authService->logout($user);
        }

        return $this->ok([], 'Logged out');
    }
}
