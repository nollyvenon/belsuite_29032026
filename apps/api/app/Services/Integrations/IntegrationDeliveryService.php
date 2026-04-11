<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use RuntimeException;

/**
 * Routes native integration deliveries with validated payloads and Octane-safe HTTP clients.
 */
final class IntegrationDeliveryService
{
    public function __construct(
        private readonly SlackIntegrationService $slack,
        private readonly WhatsAppCloudIntegrationService $whatsapp,
        private readonly SmsIntegrationService $sms,
        private readonly TransactionalEmailIntegrationService $mail,
        private readonly OutboundWebhookIntegrationService $webhooks,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function handle(string $integrationKey, array $payload): array
    {
        $key = strtolower(trim($integrationKey));

        return match (true) {
            str_starts_with($key, 'slack') => $this->deliverSlack($payload),
            str_starts_with($key, 'whatsapp') => $this->deliverWhatsApp($payload),
            str_starts_with($key, 'sms') || str_starts_with($key, 'twilio') => $this->deliverSms($payload),
            str_starts_with($key, 'email')
                || str_starts_with($key, 'mail')
                || str_starts_with($key, 'resend')
                || str_starts_with($key, 'postmark') => $this->deliverEmail($key, $payload),
            str_starts_with($key, 'webhook') => $this->deliverWebhook($payload),
            default => [
                'mode' => 'stub',
                'status' => 'accepted',
                'retryAfterSeconds' => 30,
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverSlack(array $payload): array
    {
        $data = Validator::make($payload, [
            'text' => ['required', 'string', 'max:40000'],
            'channel' => ['nullable', 'string', 'max:255'],
        ])->validate();

        try {
            $result = $this->slack->postMessage($data['text'], $data['channel'] ?? null);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['payload' => $e->getMessage()]);
        }

        return array_merge(['provider' => 'slack'], $result);
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverWhatsApp(array $payload): array
    {
        $data = Validator::make($payload, [
            'to' => ['required', 'string', 'max:32'],
            'text' => ['required', 'string', 'max:4096'],
        ])->validate();

        $result = $this->whatsapp->sendText($data['to'], $data['text']);

        return array_merge(['provider' => 'whatsapp'], $result);
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverSms(array $payload): array
    {
        $data = Validator::make($payload, [
            'to' => ['required', 'string', 'max:32'],
            'body' => ['required_without:message', 'string', 'max:1600'],
            'message' => ['required_without:body', 'string', 'max:1600'],
            'from' => ['nullable', 'string', 'max:32'],
        ])->validate();

        $body = $data['body'] ?? $data['message'];

        $result = $this->sms->sendViaTwilio($data['to'], $body, $data['from'] ?? null);

        return array_merge(['provider' => 'sms'], $result);
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverEmail(string $key, array $payload): array
    {
        $data = Validator::make($payload, [
            'to' => ['required', 'string', 'max:320'],
            'subject' => ['required', 'string', 'max:998'],
            'html' => ['nullable', 'string', 'max:512000'],
            'text' => ['nullable', 'string', 'max:512000'],
            'driver' => ['nullable', 'string', 'in:resend,postmark'],
        ])->validate();

        $driver = $data['driver'] ?? null;
        if ($driver === null) {
            $driver = str_starts_with($key, 'postmark') ? 'postmark' : (str_starts_with($key, 'resend') ? 'resend' : null);
        }

        $result = $this->mail->send(
            $data['to'],
            $data['subject'],
            ['html' => $data['html'] ?? null, 'text' => $data['text'] ?? null],
            $driver,
        );

        return array_merge(['provider' => 'email'], $result);
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverWebhook(array $payload): array
    {
        $data = Validator::make($payload, [
            'url' => ['required', 'string', 'max:2048'],
            'body' => ['nullable', 'array'],
            'signingSecret' => ['nullable', 'string', 'max:512'],
        ])->validate();

        $body = $data['body'] ?? [];

        try {
            $response = $this->webhooks->postJson(
                $data['url'],
                $body,
                $data['signingSecret'] ?? null,
            );
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['payload.url' => $e->getMessage()]);
        }

        if ($response->failed()) {
            throw new RuntimeException('Webhook returned HTTP '.$response->status());
        }

        return [
            'provider' => 'webhook',
            'ok' => true,
            'upstreamStatus' => $response->status(),
        ];
    }
}
