<?php

namespace Tests\Unit\Support\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IntegrationHttpTest extends TestCase
{
    public function test_profile_sends_connection_close_by_default(): void
    {
        Http::fake(['https://probe.example/*' => Http::response(['ok' => true], 200)]);

        IntegrationHttp::profile('nest')->get('https://probe.example/ping');

        Http::assertSent(function ($request) {
            return $request->url() === 'https://probe.example/ping'
                && $request->hasHeader('Connection', 'close');
        });
    }

    public function test_with_connection_refresh_retries_after_connection_exception(): void
    {
        $n = 0;
        Http::fake(static function () use (&$n) {
            $n++;
            if ($n === 1) {
                throw new ConnectionException('simulated transport reset');
            }

            return Http::response(['recovered' => true], 200);
        });

        $response = IntegrationHttp::withConnectionRefresh(
            static fn () => Http::get('https://retry.example/once'),
        );

        $this->assertTrue($response->successful());
        $this->assertTrue($response->json('recovered'));
    }
}
