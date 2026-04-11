<?php

namespace App\Modules\Integration\Controllers;

use App\Http\Controllers\BaseController;
use App\Services\Integrations\IntegrationDeliveryService;
use App\Services\LegacyNestBridgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class IntegrationBridgeController extends BaseController
{
    private const MAX_DELIVER_BODY_BYTES = 262_144;

    public function __construct(
        private readonly LegacyNestBridgeService $bridge,
        private readonly IntegrationDeliveryService $integrationDelivery,
    ) {
    }

    public function aiAssistant(Request $request)
    {
        $result = $this->bridge->forward('assistants/donna/chat', $request->all(), [
            'X-Tenant-ID' => (string) $request->attributes->get('tenant_id', ''),
            'X-Correlation-ID' => (string) $request->attributes->get('correlation_id', ''),
        ]);

        return $this->ok($result, 'AI assistant bridge response', $result['status'] >= 400 ? 502 : 200);
    }

    public function billing(Request $request)
    {
        $result = $this->bridge->forward('api/v1/credit-billing/usage', $request->all(), [
            'X-Tenant-ID' => (string) $request->attributes->get('tenant_id', ''),
            'X-Correlation-ID' => (string) $request->attributes->get('correlation_id', ''),
        ]);

        return $this->ok($result, 'Billing bridge response', $result['status'] >= 400 ? 502 : 200);
    }

    public function crm(Request $request)
    {
        $result = $this->bridge->forward('api/crm-engine/stats', $request->all(), [
            'X-Tenant-ID' => (string) $request->attributes->get('tenant_id', ''),
            'X-Correlation-ID' => (string) $request->attributes->get('correlation_id', ''),
        ]);

        return $this->ok($result, 'CRM bridge response', $result['status'] >= 400 ? 502 : 200);
    }

    /**
     * Native delivery: routes to Octane-safe integration clients (Slack, WhatsApp, SMS, email, HTTPS webhooks)
     * or accepts as a stub when the key does not match a known provider.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function deliver(Request $request)
    {
        if (strlen($request->getContent()) > self::MAX_DELIVER_BODY_BYTES) {
            return $this->fail('Payload too large', [], 413);
        }

        $data = $request->validate([
            'integrationKey' => ['required', 'string', 'max:128'],
            'payload' => ['required', 'array'],
        ]);

        try {
            $result = $this->integrationDelivery->handle($data['integrationKey'], $data['payload']);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), [], 503);
        }

        return $this->ok(array_merge([
            'deliveryId' => (string) Str::ulid(),
        ], $result), 'Delivery accepted', 202);
    }
}

