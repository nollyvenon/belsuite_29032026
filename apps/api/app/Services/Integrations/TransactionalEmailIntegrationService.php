<?php

namespace App\Services\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use InvalidArgumentException;
use RuntimeException;

final class TransactionalEmailIntegrationService
{
    /**
     * @param  array{html?: string|null, text?: string|null}  $content
     * @return array{ok: bool, provider: string, detail: array<string, mixed>}
     */
    public function send(string $to, string $subject, array $content, ?string $driver = null): array
    {
        $driver ??= (string) config('services.transactional_mail.default', 'resend');
        $driver = strtolower($driver);

        return match ($driver) {
            'resend' => $this->sendResend($to, $subject, $content),
            'postmark' => $this->sendPostmark($to, $subject, $content),
            default => throw new InvalidArgumentException('Unsupported transactional mail driver: '.$driver),
        };
    }

    /**
     * @param  array{html?: string|null, text?: string|null}  $content
     * @return array{ok: bool, provider: string, detail: array<string, mixed>}
     */
    private function sendResend(string $to, string $subject, array $content): array
    {
        $key = (string) config('services.resend.key', '');
        $from = (string) config('services.resend.from', '');
        if ($key === '' || $from === '') {
            throw new RuntimeException('Resend is not configured (RESEND_API_KEY, RESEND_FROM_EMAIL).');
        }

        $html = $content['html'] ?? null;
        $text = $content['text'] ?? null;
        if (($html === null || $html === '') && ($text === null || $text === '')) {
            throw new InvalidArgumentException('Email payload requires html or text.');
        }

        $payload = array_filter([
            'from' => $from,
            'to' => [$to],
            'subject' => $subject,
            'html' => $html,
            'text' => $text,
        ], static fn ($v) => $v !== null && $v !== '');

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('resend')
                ->withToken($key)
                ->post('https://api.resend.com/emails', $payload));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Resend unreachable: '.$e->getMessage(), 0, $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if ($response->failed()) {
            throw new RuntimeException('Resend API error ('.$response->status().'): '.$response->body());
        }

        return ['ok' => true, 'provider' => 'resend', 'detail' => $json];
    }

    /**
     * @param  array{html?: string|null, text?: string|null}  $content
     * @return array{ok: bool, provider: string, detail: array<string, mixed>}
     */
    private function sendPostmark(string $to, string $subject, array $content): array
    {
        $token = (string) config('services.postmark.key', '');
        $from = (string) config('services.postmark.from', '');
        if ($token === '' || $from === '') {
            throw new RuntimeException('Postmark is not configured (POSTMARK_API_KEY, POSTMARK_FROM_EMAIL).');
        }

        $html = $content['html'] ?? null;
        $text = $content['text'] ?? null;
        if (($html === null || $html === '') && ($text === null || $text === '')) {
            throw new InvalidArgumentException('Email payload requires HtmlBody or TextBody.');
        }

        $payload = array_filter(
            [
                'From' => $from,
                'To' => $to,
                'Subject' => $subject,
                'HtmlBody' => $html,
                'TextBody' => $text,
            ],
            static fn ($v) => $v !== null && $v !== '',
        );

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('postmark')
                ->withHeaders(['X-Postmark-Server-Token' => $token])
                ->post('https://api.postmarkapp.com/email', $payload));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Postmark unreachable: '.$e->getMessage(), 0, $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if ($response->failed()) {
            throw new RuntimeException('Postmark API error ('.$response->status().'): '.$response->body());
        }

        return ['ok' => true, 'provider' => 'postmark', 'detail' => $json];
    }
}
