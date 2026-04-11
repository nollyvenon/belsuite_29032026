<?php

namespace App\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

abstract class BaseController extends Controller
{
    protected function ok(mixed $data = [], string $message = '', int $status = 200): JsonResponse
    {
        return ApiResponse::success($data, $message, $status);
    }

    protected function fail(string $message = 'Request failed', mixed $data = [], int $status = 400): JsonResponse
    {
        return ApiResponse::error($message, $data, $status);
    }
}

