<?php

namespace Tests\Feature\Api\V1;

use App\Models\Crm\Deal;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CrmDealsTenantTest extends TestCase
{
    use RefreshDatabase;

    private function seedUserOrg(): array
    {
        $suffix = Str::lower(Str::random(8));
        $org = Tenant::query()->create([
            'id' => (string) Str::ulid(),
            'name' => 'Acme',
            'slug' => 'acme-'.$suffix,
            'email' => "org-{$suffix}@example.com",
            'status' => 'ACTIVE',
            'tier' => 'FREE',
            'isActive' => true,
        ]);
        $role = Role::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $org->id,
            'name' => 'Admin',
            'isSystem' => true,
        ]);
        $user = User::factory()->create([
            'id' => (string) Str::ulid(),
            'email' => "crm-{$suffix}@example.com",
        ]);
        OrganizationMember::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $org->id,
            'userId' => $user->id,
            'roleId' => $role->id,
            'status' => 'ACTIVE',
            'roleName' => 'Admin',
            'permissions' => ['read:deals'],
            'joinedAt' => now(),
        ]);

        return ['user' => $user, 'org' => $org];
    }

    public function test_deals_are_scoped_by_tenant_header(): void
    {
        $a = $this->seedUserOrg();
        $b = $this->seedUserOrg();
        Deal::withoutGlobalScopes()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $a['org']->id,
            'userId' => $a['user']->id,
            'title' => 'A deal',
            'stage' => 'PROSPECTING',
            'priority' => 'MEDIUM',
            'value' => 10,
            'currency' => 'USD',
            'probability' => 20,
            'pipelineName' => 'Sales',
        ]);
        Deal::withoutGlobalScopes()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $b['org']->id,
            'userId' => $b['user']->id,
            'title' => 'B deal',
            'stage' => 'PROSPECTING',
            'priority' => 'MEDIUM',
            'value' => 20,
            'currency' => 'USD',
            'probability' => 20,
            'pipelineName' => 'Sales',
        ]);

        Sanctum::actingAs($a['user']);
        $token = $a['user']->createToken('test', ['*'])->plainTextToken;

        $res = $this->getJson('/api/v1/crm/deals?limit=50', [
            'Authorization' => 'Bearer '.$token,
            'X-Tenant-ID' => $a['org']->id,
        ]);

        $res->assertOk();
        $this->assertSame(1, $res->json('data.total'));
        $this->assertSame('A deal', $res->json('data.items.0.title'));
    }
}
