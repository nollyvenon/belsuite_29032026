'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Plus,
  Play,
  Loader2,
  X,
  Trophy,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { useABTests } from '@/hooks/useMarketing';
import type { ABTest, ABTestAnalysis } from '@/hooks/useMarketing';

function SignificanceBadge({ significant }: { significant: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        significant
          ? 'bg-emerald-400/10 text-emerald-400'
          : 'bg-zinc-700/50 text-zinc-400'
      }`}
    >
      {significant ? 'Significant' : 'Not significant'}
    </span>
  );
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: ABTestAnalysis }) {
  const { variants, winnerVariantId, recommendation, isSignificant, pValue } = analysis;
  const maxConversions = Math.max(...variants.map((v) => v.conversions));

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-500" />
          <p className="text-sm font-medium text-white">Analysis</p>
        </div>
        <SignificanceBadge significant={isSignificant} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <div>p-value: <span className="text-white">{pValue?.toFixed(4) ?? 'N/A'}</span></div>
      </div>

      <div className="space-y-3">
        {variants.map((v) => (
          <div
            key={v.variantId}
            className={`p-3 rounded-lg border ${
              v.variantId === winnerVariantId
                ? 'border-emerald-400/30 bg-emerald-400/5'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {v.variantId === winnerVariantId && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                <p className="text-xs font-medium text-white">{v.label}</p>
                {v.isControl && <span className="text-xs text-zinc-600">control</span>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-500">
                  CVR <span className="text-white">{(v.cvr * 100).toFixed(2)}%</span>
                </span>
                {v.relativeUplift !== undefined && v.relativeUplift !== 0 && (
                  <span className={v.relativeUplift > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {v.relativeUplift > 0 ? '+' : ''}{(v.relativeUplift * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBar label="Impressions" value={v.impressions} max={Math.max(...variants.map((x) => x.impressions))} />
              <StatBar label="Conversions" value={v.conversions} max={maxConversions} />
            </div>
          </div>
        ))}
      </div>

      {recommendation && (
        <div className="flex gap-2 bg-sky-400/5 border border-sky-400/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

export function ABTestView({ campaignId }: { campaignId: string }) {
  const { tests, loading, createTest, startTest, getAnalysis, deleteTest } = useABTests(campaignId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trafficSplit: 50,
    metric: 'CVR',
    variants: [
      { name: 'Control', headline: '', body: '', cta: '' },
      { name: 'Variant B', headline: '', body: '', cta: '' },
    ],
  });
  const [creating, setCreating] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, ABTestAnalysis>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<string | null>(null);

  function setVariant(i: number, key: string, value: string) {
    setForm((prev) => {
      const copy = [...prev.variants];
      copy[i] = { ...copy[i], [key]: value };
      return { ...prev, variants: copy };
    });
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: `Variant ${String.fromCharCode(65 + prev.variants.length)}`, headline: '', body: '', cta: '' }],
    }));
  }

  function removeVariant(i: number) {
    if (form.variants.length <= 2) return;
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createTest({
        name: form.name,
        trafficSplit: form.trafficSplit,
        metric: form.metric,
        variants: form.variants,
      });
      setShowCreate(false);
      setForm({
        name: '',
        trafficSplit: 50,
        metric: 'CVR',
        variants: [
          { name: 'Control', headline: '', body: '', cta: '' },
          { name: 'Variant B', headline: '', body: '', cta: '' },
        ],
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(id: string) {
    setStartingId(id);
    try {
      await startTest(id);
    } finally {
      setStartingId(null);
    }
  }

  async function handleAnalysis(id: string) {
    if (analyses[id]) return;
    setLoadingAnalysis(id);
    try {
      const data = await getAnalysis(id);
      setAnalyses((prev) => ({ ...prev, [id]: data }));
    } finally {
      setLoadingAnalysis(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {tests.length} test{tests.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New A/B Test
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
          <FlaskConical className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No A/B tests yet for this campaign.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test, i) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <FlaskConical className="w-4 h-4 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{test.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        test.status === 'RUNNING'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : test.status === 'CONCLUDED'
                          ? 'bg-blue-400/10 text-blue-400'
                          : 'bg-zinc-700/50 text-zinc-400'
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {test.variants?.length ?? 0} variants · {test.trafficSplit}% traffic · {test.metric}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {test.status === 'PENDING' && (
                    <button
                      onClick={() => handleStart(test.id)}
                      disabled={startingId === test.id}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {startingId === test.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Start
                    </button>
                  )}
                  {(test.status === 'RUNNING' || test.status === 'CONCLUDED') && (
                    <button
                      onClick={() => handleAnalysis(test.id)}
                      disabled={loadingAnalysis === test.id}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingAnalysis === test.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BarChart2 className="w-3.5 h-3.5" />
                      )}
                      Analysis
                    </button>
                  )}
                </div>
              </div>

              {analyses[test.id] && (
                <div className="border-t border-white/5 p-4">
                  <AnalysisCard analysis={analyses[test.id]} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreate}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">New A/B Test</h3>
                <button type="button" onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-zinc-500 mb-1 block">Test Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Headline comparison test"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Metric</label>
                  <select
                    value={form.metric}
                    onChange={(e) => setForm({ ...form, metric: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                  >
                    {['CVR', 'CTR', 'ROAS', 'CPA'].map((m) => (
                      <option key={m} value={m} className="bg-[#111]">{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Traffic Split (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.trafficSplit}
                    onChange={(e) => setForm({ ...form, trafficSplit: parseInt(e.target.value) || 50 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Variants</p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-300">{v.name}</p>
                      {i > 1 && (
                        <button type="button" onClick={() => removeVariant(i)} className="text-zinc-600 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {(['headline', 'body', 'cta'] as const).map((field) => (
                      <input
                        key={field}
                        value={v[field]}
                        onChange={(e) => setVariant(i, field, e.target.value)}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                      />
                    ))}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create Test'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
