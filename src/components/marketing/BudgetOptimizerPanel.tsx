'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { useBudgetOptimizer } from '@/hooks/useMarketing';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function AllocationBar({ allocated, total }: { allocated: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (allocated / total) * 100) : 0;
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BudgetOptimizerPanel({ campaignId }: { campaignId: string }) {
  const { running, optimize, apply, error: optimizerError, result } = useBudgetOptimizer();
  const [budget, setBudget] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const totalAllocated = result
    ? result.allocations.reduce((sum, a) => sum + a.allocatedBudget, 0)
    : 0;

  async function handleOptimize(e: React.FormEvent) {
    e.preventDefault();
    setApplied(false);
    await optimize(campaignId, parseFloat(budget) || undefined);
  }

  async function handleApply() {
    if (!result) return;
    setApplying(true);
    try {
      await apply(campaignId, result);
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <form onSubmit={handleOptimize} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">AI Budget Optimizer</h3>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="number"
              min="1"
              step="any"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Total budget to allocate (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={running}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Zap className="w-4 h-4" /> Optimize</>
            )}
          </button>
        </div>
        {optimizerError && <p className="text-xs text-red-400 mt-2">{optimizerError}</p>}
      </form>

      {running && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl py-14 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
          <p className="text-sm text-zinc-500">AI is analyzing your ad performance…</p>
        </div>
      )}

      {result && !running && (
        <>
          {/* Projected metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Projected ROAS', value: `${result.projectedROAS?.toFixed(2) ?? '—'}x`, color: 'text-emerald-400' },
              { label: 'Projected Revenue', value: result.projectedRevenue ? fmtCurrency(result.projectedRevenue) : '—', color: 'text-white' },
              { label: 'Projected Conversions', value: result.projectedConversions?.toFixed(0) ?? '—', color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Allocations */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Budget Allocation</h3>
              <span className="text-xs text-zinc-500">Total: {fmtCurrency(totalAllocated)}</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {result.allocations.map((a, i) => (
                <motion.div
                  key={a.adId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <p className="text-sm text-white font-medium truncate">{a.adId ?? 'Ad'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span className="text-white font-semibold">{fmtCurrency(a.allocatedBudget)}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-emerald-400">{a.expectedROAS.toFixed(2)}x</span>
                    </div>
                  </div>
                  <AllocationBar allocated={a.allocatedBudget} total={totalAllocated} />
                  {a.reasoning && (
                    <p className="text-xs text-zinc-500 mt-1.5">{a.reasoning}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {result.aiInsights && result.aiInsights.length > 0 && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">AI Insights</h3>
              </div>
              <ul className="space-y-2">
                {result.aiInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">Warnings</h3>
              </div>
              <ul className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-2">
                    <span className="text-amber-400 shrink-0">·</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply button */}
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl font-medium transition-all disabled:opacity-60 ${
              applied
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-400/20'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {applying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
            ) : applied ? (
              <><CheckCircle className="w-4 h-4" /> Optimization Applied</>
            ) : (
              <><Zap className="w-4 h-4" /> Apply Optimization</>
            )}
          </button>
        </>
      )}
    </div>
  );
}
