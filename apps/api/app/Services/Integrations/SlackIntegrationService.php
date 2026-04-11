<?php

namespace App\Services\Integrations;

use App\Support\Integrations\IntegrationHttp;
use Illuminate\Http\Client\ConnectionException;
use InvalidArgumentException;
use RuntimeException;

final class SlackIntegrationService
{
    /**
     * @return array{ok: bool, slack: array<string, mixed>}
     */
    public function postMessage(string $text, ?string $channel = null): array
    {
        $token = (string) config('services.slack.notifications.bot_user_oauth_token', '');
        if ($token === '') {
            throw new RuntimeException('Slack bot token is not configured (SLACK_BOT_USER_OAUTH_TOKEN).');
        }

        $channel = $channel ?? (string) config('services.slack.notifications.channel', '');
        if ($channel === '') {
            throw new InvalidArgumentException('Slack channel is required in payload or SLACK_BOT_USER_DEFAULT_CHANNEL.');
        }

        try {
            $response = IntegrationHttp::withConnectionRefresh(static fn () => IntegrationHttp::profile('slack')
                ->withToken($token)
                ->post('https://slack.com/api/chat.postMessage', [
                    'channel' => $channel,
                    'text' => $text,
                ]));
        } catch (ConnectionException $e) {
            throw new RuntimeException('Slack unreachable: '.$e->getMessage(), 0, $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if (! ($json['ok'] ?? false)) {
            throw new RuntimeException('Slack API error: '.((string) ($json['error'] ?? 'unknown')));
        }

        return ['ok' => true, 'slack' => $json];
    }
}
