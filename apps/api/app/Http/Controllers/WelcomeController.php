<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

/**
 * Serializable root route (supports `php artisan route:cache`).
 */
final class WelcomeController extends Controller
{
    public function __invoke(): View
    {
        return view('welcome');
    }
}
