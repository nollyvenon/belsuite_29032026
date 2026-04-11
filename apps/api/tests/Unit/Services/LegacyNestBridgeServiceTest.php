<?php

namespace Tests\Unit\Services;

use App\Services\LegacyNestBridgeService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class LegacyNestBridgeServiceTest extends TestCase
{
    public function test_forward_returns_json_body_and_status(): void
    {
        Config::set('services.nest_backend.url', 'https://nest.test');

        Http::fake([
            'https://nest.test/api/ping' => Http::response(['hello' => 'world'], 201),
        ]);

        $svc = new LegacyNestBridgeService;
        $out = $svc->forward('api/ping', ['a' => 1], ['X-Trace' => 't1']);

        $this->assertSame(201, $out['status']);
        $this->assertSame(['hello' => 'world'], $out['body']);
    }

    public function test_forward_wraps_connection_exception(): void
    {
        Config::set('services.nest_backend.url', 'https://nest.test');

        Http::fake([
            'https://nest.test/*' => function () {
                throw new ConnectionException('timeout');
            },
        ]);

        $svc = new LegacyNestBridgeService;

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Legacy backend unreachable');

        $svc->forward('x', []);
    }
}
