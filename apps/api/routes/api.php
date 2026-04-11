<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Modules\Ai\Controllers\AiController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Accounting\Controllers\AccountingController;
use App\Modules\Content\Controllers\ContentController;
use App\Modules\Crm\Controllers\CrmDealsController;
use App\Modules\HR\Controllers\HrController;
use App\Modules\Inventory\Controllers\InventoryController;
use App\Modules\Integration\Controllers\IntegrationBridgeController;
use App\Modules\Marketing\Controllers\AutomationWorkflowController;
use App\Modules\Scheduling\Controllers\ScheduledPostController;
use App\Modules\Video\Controllers\VideoProjectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::post('/marketing/webhook', [AutomationWorkflowController::class, 'webhook']);

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/user', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user(),
                'message' => '',
            ]);
        });

        Route::prefix('accounting')->group(function (): void {
            Route::get('/subscriptions', [AccountingController::class, 'subscriptions']);
            Route::get('/invoices', [AccountingController::class, 'invoices']);
            Route::get('/payments', [AccountingController::class, 'payments']);
        });

        Route::prefix('hr')->group(function (): void {
            Route::get('/teams', [HrController::class, 'teams']);
            Route::get('/members', [HrController::class, 'members']);
        });

        Route::prefix('inventory')->group(function (): void {
            Route::get('/assets', [InventoryController::class, 'assets']);
        });

        Route::prefix('crm/deals')->group(function (): void {
            Route::get('/board', [CrmDealsController::class, 'board']);
            Route::get('/stats', [CrmDealsController::class, 'stats']);
            Route::get('/contact/{email}/timeline', [CrmDealsController::class, 'timeline']);
            Route::post('/activity', [CrmDealsController::class, 'addActivity']);
            Route::get('/', [CrmDealsController::class, 'index']);
            Route::post('/', [CrmDealsController::class, 'store']);
            Route::get('/{id}', [CrmDealsController::class, 'show']);
            Route::patch('/{id}', [CrmDealsController::class, 'update']);
            Route::delete('/{id}', [CrmDealsController::class, 'destroy']);
            Route::post('/{id}/ai-score', [CrmDealsController::class, 'aiScore']);
        });

        Route::prefix('content')->group(function (): void {
            Route::get('/', [ContentController::class, 'index']);
            Route::post('/', [ContentController::class, 'store']);
            Route::get('/{id}', [ContentController::class, 'show']);
            Route::patch('/{id}', [ContentController::class, 'update']);
            Route::delete('/{id}', [ContentController::class, 'destroy']);
        });

        Route::prefix('ai')->group(function (): void {
            Route::post('/generate', [AiController::class, 'generate']);
            Route::get('/jobs/{jobId}', [AiController::class, 'jobStatus']);
        });

        Route::prefix('scheduling/posts')->group(function (): void {
            Route::get('/', [ScheduledPostController::class, 'index']);
            Route::post('/', [ScheduledPostController::class, 'store']);
            Route::patch('/{id}', [ScheduledPostController::class, 'update']);
            Route::delete('/{id}', [ScheduledPostController::class, 'destroy']);
        });

        Route::prefix('video/projects')->group(function (): void {
            Route::get('/', [VideoProjectController::class, 'index']);
            Route::post('/', [VideoProjectController::class, 'store']);
            Route::post('/{id}/render', [VideoProjectController::class, 'render']);
            Route::get('/jobs/{jobId}', [VideoProjectController::class, 'jobStatus']);
        });

        Route::prefix('marketing/workflows')->group(function (): void {
            Route::get('/', [AutomationWorkflowController::class, 'index']);
            Route::post('/', [AutomationWorkflowController::class, 'store']);
            Route::patch('/{id}', [AutomationWorkflowController::class, 'update']);
        });

        Route::prefix('integrations')->group(function (): void {
            Route::post('/ai-assistant/relay', [IntegrationBridgeController::class, 'aiAssistant']);
            Route::post('/billing/relay', [IntegrationBridgeController::class, 'billing']);
            Route::post('/crm/relay', [IntegrationBridgeController::class, 'crm']);
            Route::post('/deliver', [IntegrationBridgeController::class, 'deliver']);
        });
    });
});
