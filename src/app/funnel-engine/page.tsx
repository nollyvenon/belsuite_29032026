'use client';

import { FormEvent, useState } from 'react';
import { useFunnelEngine } from '@/hooks/useFunnelEngine';
import type { AIOptimizationResult, AIStructureSuggestion, Funnel } from '@/hooks/useFunnelEngine';
import { AppShell } from '@/components/system/AppShell';
import { PageHeader } from '@/components/system/PageHeader';

const STEP_BADGE: Record<string, string> = {
  landing: 'bg-sky-500/15 text-sky-300',
  capture: 'bg-emerald-500/15 text-emerald-300',
  upsell: 'bg-violet-500/15 text-violet-300',
  downsell: 'bg-amber-500/15 text-amber-300',
  thankyou: 'bg-teal-500/15 text-teal-300',
  webinar: 'bg-pink-500/15 text-pink-300',
  checkout: 'bg-orange-500/15 text-orange-300',
};

// ─── Sub-panels ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function FunnelCard({
  funnel,
  onOptimize,
}: {
  funnel: Funnel;
  onOptimize: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{funnel.name}</p>
          {funnel.offerName && <p className="text-xs text-slate-400">{funnel.offerName}</p>}
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
          {funnel.goal?.replace('_', ' ')}
        </span>
      </div>

      {funnel.steps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {funnel.steps.map((step) => (
            <span
              key={step.stepId}
              className={`rounded px-2 py-0.5 text-xs font-mono ${STEP_BADGE[step.type] || 'bg-white/10 text-slate-300'}`}
            >
              {step.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-slate-500">
        <span>{funnel.stepCount} steps</span>
        <button
          onClick={() => onOptimize(funnel.id)}
          className="rounded-xl bg-violet-600/20 px-3 py-1.5 text-violet-300 hover:bg-violet-600/40 text-xs"
        >
          AI Optimize
        </button>
      </div>
    </div>
  );
}

function OptimizationPanel({ result }: { result: AIOptimizationResult }) {
  const { analysis } = result;
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-violet-200">AI Conversion Analysis</p>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
          Score {analysis.overallScore}/100
        </span>
      </div>

      {analysis.topIssues?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">Top Issues</p>
          <ul className="space-y-1">
            {analysis.topIssues.map((issue, i) => (
              <li key={i} className="text-sm text-slate-300 before:mr-2 before:text-red-400 before:content-['✕']">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.quickWins?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">Quick Wins</p>
          <ul className="space-y-1">
            {analysis.quickWins.map((win, i) => (
              <li key={i} className="text-sm text-slate-300 before:mr-2 before:text-emerald-400 before:content-['✓']">
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Step Recommendations</p>
          {analysis.suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-slate-300">{s.step}</span>
                <span className="text-slate-400">{s.issue}</span>
              </div>
              <p className="mt-1 text-slate-200">{s.recommendation}</p>
              <p className="mt-0.5 text-xs text-emerald-400">{s.expectedLift}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StructurePanel({ result }: { result: AIStructureSuggestion }) {
  const { suggestion } = result;
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sky-200">AI Funnel Structure Suggestion</p>
        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
          Est. CVR {suggestion.estimatedCvr}
        </span>
      </div>
      <p className="text-sm text-slate-400">{suggestion.rationale}</p>
      <div className="space-y-2">
        {suggestion.steps?.map((step, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-300">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{step.name}</p>
              <p className="text-xs text-slate-400">{step.headline}</p>
              <p className="mt-0.5 text-xs text-slate-500">{step.keyElement}</p>
            </div>
            <span
              className={`ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-mono ${STEP_BADGE[step.type] || 'bg-white/10 text-slate-300'}`}
            >
              {step.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FunnelEnginePage() {
  const {
    stats,
    funnels,
    forms,
    loading,
    error,
    reload,
    createFunnel,
    createForm,
    optimizeConversion,
    suggestStructure,
  } = useFunnelEngine();

  // form state
  const [funnelForm, setFunnelForm] = useState({
    name: '',
    goal: 'lead_capture' as const,
    description: '',
    targetAudience: '',
    offerName: '',
  });

  const [captureFormState, setCaptureFormState] = useState({
    name: '',
    description: '',
  });

  const [suggestForm, setSuggestForm] = useState({
    goal: 'high-ticket B2B SaaS demo booking',
    product: '',
    audience: 'B2B decision makers',
    industry: '',
    pricePoint: 'mid-market',
  });

  const [optimizeTarget, setOptimizeTarget] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<AIOptimizationResult | null>(null);
  const [structureResult, setStructureResult] = useState<AIStructureSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState<'funnels' | 'forms' | 'ai'>('funnels');

  async function onCreateFunnel(e: FormEvent) {
    e.preventDefault();
    await createFunnel({
      ...funnelForm,
      steps: [
        { name: 'Hook & Offer', type: 'landing', ctaText: 'Get Started Free' },
        { name: 'Lead Capture', type: 'capture', ctaText: 'Send My Plan' },
        { name: 'Thank You', type: 'thankyou', ctaText: 'Book Strategy Call' },
      ],
    });
    setFunnelForm((p) => ({ ...p, name: '', description: '', offerName: '' }));
    await reload();
  }

  async function onCreateForm(e: FormEvent) {
    e.preventDefault();
    await createForm({
      name: captureFormState.name,
      description: captureFormState.description,
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', required: true },
        { name: 'email', type: 'email', label: 'Work email', required: true },
      ],
      submitLabel: 'Get Access',
    });
    setCaptureFormState({ name: '', description: '' });
    await reload();
  }

  async function onOptimize(funnelId: string) {
    setOptimizeTarget(funnelId);
    setAiLoading(true);
    setActiveTab('ai');
    try {
      const result = await optimizeConversion(funnelId);
      setOptimizationResult(result);
    } finally {
      setAiLoading(false);
    }
  }

  async function onSuggestStructure(e: FormEvent) {
    e.preventDefault();
    setAiLoading(true);
    try {
      const result = await suggestStructure(suggestForm);
      setStructureResult(result);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <AppShell activeRoute="funnel-engine">
      <PageHeader
        eyebrow="Module 6"
        title="Funnel & Conversion Engine"
        description="Build landing pages, funnels, and lead capture forms. Let AI optimize conversion rates and suggest best-performing funnel structures."
        actions={
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
          >
            Refresh
          </button>
        }
      />

      {loading && <p className="mt-8 text-slate-400">Loading funnel engine...</p>}
      {error && <p className="mt-8 text-red-400">{error}</p>}

      {/* Stats */}
      {stats && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Funnels" value={String(stats.totals.funnels)} />
          <StatCard label="Forms" value={String(stats.totals.forms)} />
          <StatCard label="Captures" value={String(stats.totals.captures)} sub="last 30 days" />
          <StatCard label="Step Completions" value={String(stats.totals.stepCompletions)} />
          <StatCard label="Conversions" value={String(stats.totals.conversions)} />
          <StatCard label="CVR" value={`${stats.totals.overallConversionRate}%`} sub="captures → convert" />
        </section>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-2">
        {(['funnels', 'forms', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-black font-semibold'
                : 'border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab === 'ai' ? 'AI Tools' : tab}
          </button>
        ))}
      </div>

      {/* ── Funnels Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'funnels' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create form */}
          <form onSubmit={onCreateFunnel} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 self-start">
            <h2 className="font-semibold text-white">New Funnel</h2>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Funnel name *"
              value={funnelForm.name}
              onChange={(e) => setFunnelForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Offer name"
              value={funnelForm.offerName}
              onChange={(e) => setFunnelForm((p) => ({ ...p, offerName: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Target audience"
              value={funnelForm.targetAudience}
              onChange={(e) => setFunnelForm((p) => ({ ...p, targetAudience: e.target.value }))}
            />
            <select
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
              value={funnelForm.goal}
              onChange={(e) => setFunnelForm((p) => ({ ...p, goal: e.target.value as typeof funnelForm.goal }))}
            >
              <option value="lead_capture">Lead Capture</option>
              <option value="sales">Sales</option>
              <option value="webinar">Webinar</option>
              <option value="free_trial">Free Trial</option>
              <option value="demo_booking">Demo Booking</option>
              <option value="newsletter">Newsletter</option>
            </select>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none"
              placeholder="Description"
              rows={2}
              value={funnelForm.description}
              onChange={(e) => setFunnelForm((p) => ({ ...p, description: e.target.value }))}
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Create Funnel
            </button>
          </form>

          {/* Funnel list */}
          <div>
            {!funnels.length && !loading && (
              <p className="text-sm text-slate-400">No funnels yet. Create your first one.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {funnels.map((funnel) => (
                <FunnelCard key={funnel.id} funnel={funnel} onOptimize={onOptimize} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Forms Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'forms' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={onCreateForm} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 self-start">
            <h2 className="font-semibold text-white">New Lead Capture Form</h2>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Form name *"
              value={captureFormState.name}
              onChange={(e) => setCaptureFormState((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Description"
              value={captureFormState.description}
              onChange={(e) => setCaptureFormState((p) => ({ ...p, description: e.target.value }))}
            />
            <p className="text-xs text-slate-500">
              Default template: First Name + Work Email with a "Get Access" CTA. Additional fields can be added via
              the API.
            </p>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Create Form
            </button>
          </form>

          <div>
            {!forms.length && !loading && (
              <p className="text-sm text-slate-400">No forms yet.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {forms.map((form) => (
                <div key={form.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <p className="font-semibold text-white">{form.name}</p>
                  {form.description && <p className="text-xs text-slate-400">{form.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {form.fields.map((field) => (
                      <span
                        key={field.name}
                        className="rounded border border-white/10 px-2 py-0.5 font-mono text-xs text-slate-400"
                      >
                        {field.name}
                        {field.required ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{form.fields.length} fields · CTA: {form.submitLabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Tools Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="mt-6 space-y-8">
          {/* CRO optimizer */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="font-semibold text-white">Optimize Conversion Rate</h2>
              <p className="text-sm text-slate-400">
                Select a funnel and AI will analyse step performance, surface drop-off issues, and list prioritised
                quick wins.
              </p>
              <select
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
                value={optimizeTarget}
                onChange={(e) => setOptimizeTarget(e.target.value)}
              >
                <option value="">Select funnel</option>
                {funnels.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!optimizeTarget || aiLoading}
                onClick={() => onOptimize(optimizeTarget)}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
              >
                {aiLoading ? 'Analysing...' : 'Run AI CRO Analysis'}
              </button>
            </div>

            <form onSubmit={onSuggestStructure} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <h2 className="font-semibold text-white">Suggest Funnel Structure</h2>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                placeholder="Goal (e.g. book demo calls)"
                value={suggestForm.goal}
                onChange={(e) => setSuggestForm((p) => ({ ...p, goal: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                placeholder="Product description"
                value={suggestForm.product}
                onChange={(e) => setSuggestForm((p) => ({ ...p, product: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                placeholder="Target audience"
                value={suggestForm.audience}
                onChange={(e) => setSuggestForm((p) => ({ ...p, audience: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                  placeholder="Industry"
                  value={suggestForm.industry}
                  onChange={(e) => setSuggestForm((p) => ({ ...p, industry: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                  placeholder="Price point"
                  value={suggestForm.pricePoint}
                  onChange={(e) => setSuggestForm((p) => ({ ...p, pricePoint: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={aiLoading}
                className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
              >
                {aiLoading ? 'Generating...' : 'Generate Structure'}
              </button>
            </form>
          </div>

          {optimizationResult && <OptimizationPanel result={optimizationResult} />}
          {structureResult && <StructurePanel result={structureResult} />}

          {/* UTM attribution */}
          {stats && stats.byUtmSource.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 font-semibold text-white">Capture Attribution by UTM Source</h2>
              <div className="space-y-1.5">
                {stats.byUtmSource.map((row) => {
                  const max = Math.max(...stats.byUtmSource.map((r) => r.count));
                  const pct = max === 0 ? 0 : Math.round((row.count / max) * 100);
                  return (
                    <div key={row.source} className="flex items-center gap-3 text-sm">
                      <span className="w-28 shrink-0 text-slate-400">{row.source}</span>
                      <div className="h-2 flex-1 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-400">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
