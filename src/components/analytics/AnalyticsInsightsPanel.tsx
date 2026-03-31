'use client';

import { AlertTriangle, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';
import type { AnalyticsInsight } from '@/hooks/useAnalytics';

const CONFIG = {
  positive: {
    Icon: CheckCircle2,
    tone: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
  },
  warning: {
    Icon: AlertTriangle,
    tone: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  },
  opportunity: {
    Icon: Lightbulb,
    tone: 'text-sky-400 border-sky-400/20 bg-sky-400/10',
  },
};

export function AnalyticsInsightsPanel({ insights, loading }: { insights: AnalyticsInsight[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">AI Recommendations</h3>
          <p className="text-sm text-zinc-500">What is working, what is failing, and what to do next.</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      <div className="space-y-4">
        {insights.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">No recommendations yet.</div>
        ) : (
          insights.map((insight) => {
            const cfg = CONFIG[insight.type];
            const Icon = cfg.Icon;

            return (
              <div key={`${insight.type}-${insight.title}`} className="rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border ${cfg.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{insight.title}</p>
                      <span className="text-[11px] text-zinc-500">{Math.round(insight.confidence * 100)}% confidence</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{insight.summary}</p>
                    <p className="mt-3 text-sm text-zinc-200">{insight.action}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}