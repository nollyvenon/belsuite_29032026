<?php

use App\Http\Middleware\CorrelationId;
use App\Http\Middleware\EnforceRbac;
use App\Http\Middleware\ResolveTenant;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'rbac' => EnforceRbac::class,
            'tenant' => ResolveTenant::class,
        ]);

        $middleware->appendToGroup('api', [
            CorrelationId::class,
            ResolveTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return ApiResponse::error('Validation failed', $e->errors(), 422);
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error('Unauthenticated', [], 401);
            }

            if ($e instanceof AuthorizationException) {
                return ApiResponse::error('Forbidden', [], 403);
            }

            if ($e instanceof NotFoundHttpException) {
                return ApiResponse::error('Not found', [], 404);
            }

            if ($e instanceof HttpExceptionInterface) {
                return ApiResponse::error($e->getMessage() ?: 'Request failed', [], $e->getStatusCode());
            }

            report($e);

            return ApiResponse::error(
                config('app.debug') ? $e->getMessage() : 'Server error',
                [],
                500
            );
        });
    })->create();
