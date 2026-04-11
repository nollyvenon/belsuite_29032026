<?php

namespace App\Services\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

final class SmsIntegrationService
{
    /**
     * @return array{ok: bool, twilio: array<string, mixed>}
     */
    public function sendViaTwilio(string $to, string $body, ?string $from = null): array
    {
        $sid = (string) config('services.twilio.account_sid', '');
        $token = (string) config('services.twilio.auth_token', '');
        $from = $from ?? (string) config('services.twilio.from', '');

        if ($sid === '' || $token === '' || $from === '') {
            throw new RuntimeException('Twilio SMS is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).');
        }

        $url = sprintf('https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json', $sid);

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('twilio_sms')
                ->withBasicAuth($sid, $token)
                ->asForm()
                ->post($url, [
                    'To' => $to,
                    'From' => $from,
                    'Body' => $body,
                ]));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Twilio unreachable: '.$e->getMessage(), 0, $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if ($response->failed()) {
            $msg = (string) ($json['message'] ?? $response->body());

            throw new RuntimeException('Twilio API error ('.$response->status().'): '.$msg);
        }

        return ['ok' => true, 'twilio' => $json];
    }
}
