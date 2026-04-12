<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IntegrationNestRelayTest extends TestCase
{
    use RefreshDatabase;

    public function test_nest_relays_return_503_when_fallback_disabled(): void
    {
        config(['strangler.nest_fallback_enabled' => false]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $relays = [
            ['/api/v1/integrations/ai-assistant/relay', []],
            ['/api/v1/integrations/billing/relay', []],
            ['/api/v1/integrations/crm/relay', []],
        ];

        foreach ($relays as [$path, $body]) {
            $this->postJson($path, $body)
                ->assertStatus(503)
                ->assertJsonPath('success', false)
                ->assertJsonPath('data.code', 'nest_relay_disabled');
        }
    }

    public function test_deliver_still_works_when_nest_fallback_disabled(): void
    {
        config(['strangler.nest_fallback_enabled' => false]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/integrations/deliver', [
            'integrationKey' => 'custom-internal',
            'payload' => ['x' => 1],
        ])->assertStatus(202);
    }
}
