<?php

namespace App\Services\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use InvalidArgumentException;
use RuntimeException;

final class OutboundWebhookIntegrationService
{
    /**
     * @param  array<string, string>  $headers
     */
    public function postJson(string $url, array $payload, ?string $signingSecret = null, array $headers = []): Response
    {
        $this->assertAllowedWebhookUrl($url);

        $raw = json_encode($payload, JSON_THROW_ON_ERROR);
        $sendHeaders = $headers;
        if ($signingSecret !== null && $signingSecret !== '') {
            $sendHeaders['X-Belsuite-Signature'] = hash_hmac('sha256', $raw, $signingSecret);
        }

        try {
            return IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('outbound_webhook')
                ->withHeaders($sendHeaders)
                ->withBody($raw, 'application/json')
                ->post($url));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Webhook target unreachable: '.$e->getMessage(), 0, $e);
        }
    }

    private function assertAllowedWebhookUrl(string $url): void
    {
        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            throw new InvalidArgumentException('Invalid webhook URL.');
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if ($scheme !== 'https') {
            throw new InvalidArgumentException('Webhook URL must use https.');
        }
    }
}
