<?php

namespace App\Modules\Auth\Services;

use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Auth\Support\AuthUserResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService
{
    private const ACCESS_MINUTES = 15;

    private const REFRESH_DAYS = 7;

    /** @var list<string> */
    private const DEFAULT_ADMIN_PERMS = [
        'create:content', 'read:content', 'update:content', 'delete:content',
        'manage:users', 'manage:organization', 'manage:billing', 'manage:integrations',
        'manage:ai', 'manage:automation', 'read:analytics', 'read:deals', 'manage:deals',
    ];

    public function register(array $payload): array
    {
        $email = strtolower(trim((string) $payload['email']));

        if (User::query()->where('email', $email)->exists()) {
            throw new ConflictHttpException('Email already registered');
        }

        $firstName = (string) ($payload['first_name'] ?? '');
        $lastName = (string) ($payload['last_name'] ?? '');
        $orgName = $payload['organization_name'] ?? null;
        $orgName = is_string($orgName) && $orgName !== ''
            ? $orgName
            : ($firstName !== '' ? "{$firstName}'s Workspace" : explode('@', $email)[0]."'s Workspace");

        $result = DB::transaction(function () use ($email, $payload, $firstName, $lastName, $orgName) {
            $user = User::query()->create([
                'id' => (string) Str::ulid(),
                'email' => $email,
                'passwordHash' => $payload['password'],
                'firstName' => $firstName !== '' ? $firstName : null,
                'lastName' => $lastName !== '' ? $lastName : null,
                'phoneNumber' => $payload['phone_number'] ?? null,
                'timezone' => 'UTC',
                'preferredLanguage' => 'en',
                'status' => 'PENDING_VERIFICATION',
            ]);

            $org = Tenant::query()->create([
                'id' => (string) Str::ulid(),
                'name' => $orgName,
                'slug' => $this->uniqueOrgSlug($orgName),
                'email' => $email,
                'status' => 'ACTIVE',
                'tier' => 'FREE',
                'isActive' => true,
            ]);

            $adminRole = Role::query()->create([
                'id' => (string) Str::ulid(),
                'organizationId' => $org->id,
                'name' => 'Admin',
                'description' => null,
                'isSystem' => true,
            ]);

            OrganizationMember::query()->create([
                'id' => (string) Str::ulid(),
                'organizationId' => $org->id,
                'userId' => $user->id,
                'roleId' => $adminRole->id,
                'status' => 'ACTIVE',
                'roleName' => 'Admin',
                'permissions' => self::DEFAULT_ADMIN_PERMS,
                'joinedAt' => now(),
            ]);

            return ['user' => $user->fresh(), 'organizationId' => $org->id];
        });

        return $this->issueTokenResponse($result['user'], $result['organizationId']);
    }

    public function login(array $payload, ?string $tenantId = null): array
    {
        $email = strtolower(trim((string) $payload['email']));
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($payload['password'], (string) $user->passwordHash)) {
            throw new UnauthorizedHttpException('', 'Invalid credentials');
        }

        if ($user->status === 'BANNED') {
            throw new AccessDeniedHttpException('Account is disabled');
        }

        $organizationId = $tenantId;

        if ($organizationId !== null && $organizationId !== '') {
            $membership = OrganizationMember::query()
                ->where('organizationId', $organizationId)
                ->where('userId', $user->id)
                ->where('status', 'ACTIVE')
                ->first();

            if (! $membership) {
                throw new UnauthorizedHttpException('', 'Tenant membership required');
            }
        } else {
            $organizationId = $this->primaryOrganizationId($user->id);
            if ($organizationId === null) {
                throw new UnauthorizedHttpException('', 'User has no organization');
            }
        }

        $user->forceFill(['lastLogin' => now()])->save();

        return $this->issueTokenResponse($user->fresh(), $organizationId);
    }

    public function refresh(string $plainRefreshToken): array
    {
        $token = PersonalAccessToken::findToken($plainRefreshToken);

        if (! $token || $token->name !== 'refresh' || ! $token->can('refresh')) {
            throw new UnauthorizedHttpException('', 'Invalid or expired refresh token');
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();
            throw new UnauthorizedHttpException('', 'Invalid or expired refresh token');
        }

        /** @var User|null $user */
        $user = $token->tokenable;
        if (! $user instanceof User || $user->status === 'BANNED') {
            throw new UnauthorizedHttpException('', 'User unavailable');
        }

        $organizationId = $this->primaryOrganizationId($user->id);
        if ($organizationId === null) {
            throw new NotFoundHttpException('User has no organization');
        }

        $token->delete();
        $user->tokens()->where('name', 'access')->delete();

        return $this->issueTokenResponse($user->fresh(), $organizationId);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    public function primaryOrganizationIdForUser(string $userId): ?string
    {
        return $this->primaryOrganizationId($userId);
    }

    /**
     * @return array{accessToken: string, refreshToken: string, expiresIn: int, user: array<string, mixed>, organizationId: string}
     */
    private function issueTokenResponse(User $user, string $organizationId): array
    {
        $access = $user->createToken(
            'access',
            ['*'],
            now()->addMinutes(self::ACCESS_MINUTES),
        );
        $refresh = $user->createToken(
            'refresh',
            ['refresh'],
            now()->addDays(self::REFRESH_DAYS),
        );

        return [
            'accessToken' => $access->plainTextToken,
            'refreshToken' => $refresh->plainTextToken,
            'expiresIn' => self::ACCESS_MINUTES * 60,
            'user' => AuthUserResource::toArray($user),
            'organizationId' => $organizationId,
        ];
    }

    private function primaryOrganizationId(string $userId): ?string
    {
        $row = OrganizationMember::query()
            ->where('userId', $userId)
            ->where('status', 'ACTIVE')
            ->orderBy('joinedAt')
            ->first();

        return $row?->organizationId;
    }

    private function uniqueOrgSlug(string $name): string
    {
        $base = Str::slug(Str::lower($name));
        $base = $base !== '' ? Str::limit($base, 50, '') : 'org';
        $slug = $base.'-'.Str::lower(Str::random(6));

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.Str::lower(Str::random(8));
        }

        return $slug;
    }
}
