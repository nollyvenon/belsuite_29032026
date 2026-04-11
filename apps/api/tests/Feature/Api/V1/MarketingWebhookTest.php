<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class MarketingWebhookTest extends TestCase
{
    public function test_marketing_webhook_accepts_when_token_not_configured(): void
    {
        $this->postJson('/api/v1/marketing/webhook', ['event' => 'ping'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.received', true);
    }
}
