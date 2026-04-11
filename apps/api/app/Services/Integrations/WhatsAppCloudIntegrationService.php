<?php

namespace App\Services\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

final class WhatsAppCloudIntegrationService
{
    /**
     * @return array{ok: bool, meta: array<string, mixed>}
     */
    public function sendText(string $to, string $text): array
    {
        $phoneNumberId = (string) config('services.whatsapp.phone_number_id', '');
        $accessToken = (string) config('services.whatsapp.access_token', '');
        $version = (string) config('services.whatsapp.api_version', 'v21.0');

        if ($phoneNumberId === '' || $accessToken === '') {
            throw new RuntimeException('WhatsApp Cloud API is not configured (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN).');
        }

        $url = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            trim($version, '/'),
            $phoneNumberId,
        );

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('whatsapp')
                ->withToken($accessToken)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'to' => $to,
                    'type' => 'text',
                    'text' => ['body' => $text],
                ]));
        } catch (ConnectionException $e) {
            throw new RuntimeException('WhatsApp API unreachable: '.$e->getMessage(), 0, $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if ($response->failed()) {
            $msg = isset($json['error']) && is_array($json['error'])
                ? (string) ($json['error']['message'] ?? json_encode($json['error']))
                : $response->body();

            throw new RuntimeException('WhatsApp API error ('.$response->status().'): '.$msg);
        }

        return ['ok' => true, 'meta' => $json];
    }
}
