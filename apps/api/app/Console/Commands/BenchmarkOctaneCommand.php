<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class BenchmarkOctaneCommand extends Command
{
    protected $signature = 'benchmark:octane
                            {--url= : Base URL (default APP_URL)}
                            {--iterations=25 : Requests per endpoint}
                            {--save-baseline : Write storage/app/octane-benchmark-baseline.json}
                            {--compare : Compare to baseline and print delta}';

    protected $description = 'Measure API latency (p50/p95) for Octane tuning; save/compare baselines';

    public function handle(): int
    {
        $base = rtrim((string) ($this->option('url') ?: config('app.url')), '/');
        $n = max(1, (int) $this->option('iterations'));
        $endpoints = [
            'GET /api/v1/health' => $base.'/api/v1/health',
        ];

        $results = [];
        foreach ($endpoints as $label => $url) {
            $samples = [];
            for ($i = 0; $i < $n; $i++) {
                $t0 = hrtime(true);
                $res = Http::timeout(30)->get($url);
                $ms = (hrtime(true) - $t0) / 1e6;
                if (! $res->successful()) {
                    $this->error("Request failed: {$label} HTTP {$res->status()}");

                    return self::FAILURE;
                }
                $samples[] = $ms;
            }
            sort($samples);
            $results[$label] = [
                'url' => $url,
                'iterations' => $n,
                'p50_ms' => round($this->percentile($samples, 50), 3),
                'p95_ms' => round($this->percentile($samples, 95), 3),
                'min_ms' => round($samples[0], 3),
                'max_ms' => round($samples[$n - 1], 3),
            ];
        }

        $payload = [
            'generated_at' => now()->toIso8601String(),
            'php' => PHP_VERSION,
            'octane' => (bool) ($_SERVER['LARAVEL_OCTANE'] ?? false),
            'cache_store' => config('cache.default'),
            'queue' => config('queue.default'),
            'endpoints' => $results,
        ];

        $path = storage_path('app/octane-benchmark-baseline.json');
        if ($this->option('save-baseline')) {
            file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT));
            $this->info("Baseline saved to {$path}");
        }

        $this->table(
            ['Endpoint', 'p50 ms', 'p95 ms', 'min', 'max'],
            collect($results)->map(fn (array $r, string $label) => [
                $label,
                $r['p50_ms'],
                $r['p95_ms'],
                $r['min_ms'],
                $r['max_ms'],
            ])->values()->all(),
        );

        if ($this->option('compare') && is_file($path)) {
            /** @var array<string, mixed> $before */
            $before = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            $this->newLine();
            $this->info('Comparison vs baseline (negative delta = faster):');
            foreach ($results as $label => $after) {
                $prev = data_get($before, "endpoints.{$label}.p50_ms");
                if ($prev === null) {
                    continue;
                }
                $delta = round((float) $after['p50_ms'] - (float) $prev, 3);
                $pct = $prev > 0 ? round(($delta / $prev) * 100, 1) : 0.0;
                $this->line("  {$label}: p50 Δ {$delta} ms ({$pct}%)");
            }
        }

        return self::SUCCESS;
    }

    /**
     * @param  list<float>  $sorted
     */
    private function percentile(array $sorted, int $p): float
    {
        $c = count($sorted);
        if ($c === 0) {
            return 0.0;
        }
        $idx = (int) ceil($c * ($p / 100)) - 1;

        return $sorted[max(0, min($c - 1, $idx))];
    }
}
