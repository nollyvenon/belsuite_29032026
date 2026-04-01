'use client';

import { AlertCircle, CheckCircle2, Clock, Zap, Loader2 } from 'lucide-react';
import { useContentPipelineMetrics } from '@/hooks/useAnalyticsInsights';

export function ContentPipelineStatus() {
  const { metrics, loading, error } = useContentPipelineMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        Could not load pipeline metrics
      </div>
    );
  }  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Content Production Pipeline</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { id: 'uploaded', name: 'Uploaded', count: metrics.uploaded, avgTime: '2m', icon: Clock, color: 'sky' },
            { id: 'processing', name: 'Processing', count: metrics.processing, avgTime: '15m', icon: Zap, color: 'amber' },
            { id: 'review', name: 'Review', count: metrics.review, avgTime: '45m', icon: AlertCircle, color: 'violet' },
            { id: 'published', name: 'Published', count: metrics.published, avgTime: '—', icon: CheckCircle2, color: 'emerald' },
          ].map((stage) => {
            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400' },
              amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
              violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
              emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
            };

            const colors = colorMap[stage.color] || colorMap.sky;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                  <span className="text-xs font-semibold text-slate-400">AVG {stage.avgTime}</span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{stage.name}</p>
                <p className="text-3xl font-bold text-white">{stage.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Production Quality Metrics</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Success Rate', value: `${metrics.successRate}%`, trend: '+0.3%' },
            { label: 'Avg Processing Time', value: metrics.avgProcessingTime, trend: '-2m 15s' },
            { label: 'Failed Renders', value: `${metrics.failedRenders} / ${metrics.totalRenders}`, trend: 'Normal' },
          ].map((metric) => (
            <div key={metric.label}>
              <p className="text-xs text-slate-400 mb-2">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-emerald-400">{metric.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
