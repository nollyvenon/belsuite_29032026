<?php

namespace Tests\Unit\Services\Integrations;

use App\Services\Integrations\SlackIntegrationService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SlackIntegrationServiceTest extends TestCase
{
    public function test_post_message_calls_slack_api_with_bearer_token(): void
    {
        Config::set('services.slack.notifications.bot_user_oauth_token', 'xoxb-test');
        Config::set('services.slack.notifications.channel', 'C01234567');

        Http::fake([
            'https://slack.com/api/chat.postMessage' => Http::response([
                'ok' => true,
                'ts' => '123.456',
            ], 200),
        ]);

        $svc = new SlackIntegrationService;
        $out = $svc->postMessage('hello from test');

        $this->assertTrue($out['ok']);
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'slack.com/api/chat.postMessage')
                && $request->hasHeader('Authorization', 'Bearer xoxb-test')
                && $request->hasHeader('Connection', 'close');
        });
    }
}
