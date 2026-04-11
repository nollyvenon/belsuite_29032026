<?php

namespace App\Providers;

use App\Support\CurrentRequestContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CurrentRequestContext::class, static fn (): CurrentRequestContext => new CurrentRequestContext);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (isset($_SERVER['LARAVEL_OCTANE'])) {
            Model::preventLazyLoading(! $this->app->isProduction());
        }

        Queue::failing(function (JobFailed $event): void {
            $channel = (string) config('queue.monitoring.log_channel', 'stack');
            Log::channel($channel)->error('queue.worker.failing', [
                'name' => $event->job->resolveName(),
                'connection' => $event->connectionName,
                'queue' => $event->job->getQueue(),
                'uuid' => $event->job->uuid(),
                'job_id' => $event->job->getJobId(),
                'message' => $event->exception->getMessage(),
                'exception' => $event->exception::class,
            ]);
        });
    }
}
