<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IntegrationDeliverTest extends TestCase
{
    use RefreshDatabase;

    public function test_deliver_stub_branch_returns_202(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/integrations/deliver', [
            'integrationKey' => 'custom-internal',
            'payload' => ['note' => 'noop'],
        ]);

        $response->assertStatus(202)
            ->assertJsonPath('data.mode', 'stub')
            ->assertJsonPath('data.status', 'accepted');
    }

    public function test_deliver_slack_validation_error_returns_422(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/integrations/deliver', [
            'integrationKey' => 'slack',
            'payload' => [],
        ]);

        $response->assertStatus(422);
    }
}
