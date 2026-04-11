<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class ContractParityTest extends TestCase
{
    public function test_health_endpoint_returns_standard_envelope(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'API is healthy',
            ]);
    }

    public function test_migrated_erp_endpoints_are_protected_by_auth(): void
    {
        $getPaths = [
            '/api/v1/accounting/subscriptions',
            '/api/v1/accounting/invoices',
            '/api/v1/accounting/payments',
            '/api/v1/hr/teams',
            '/api/v1/hr/members',
            '/api/v1/inventory/assets',
            '/api/v1/crm/deals',
            '/api/v1/content',
            '/api/v1/scheduling/posts',
            '/api/v1/video/projects',
            '/api/v1/marketing/workflows',
        ];

        foreach ($getPaths as $path) {
            $this->getJson($path)->assertUnauthorized();
        }

        $postPaths = [
            ['/api/v1/ai/generate', ['prompt' => 'hello']],
            ['/api/v1/integrations/deliver', ['integrationKey' => 'x', 'payload' => []]],
        ];
        foreach ($postPaths as [$path, $body]) {
            $this->postJson($path, $body)->assertUnauthorized();
        }
    }
}

