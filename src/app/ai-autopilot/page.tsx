'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AppShell } from '@/components/system/AppShell';
import { PageHeader } from '@/components/system/PageHeader';
import { useAIAutopilot } from '@/hooks/useAIAutopilot';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default function AIAutopilotPage() {
  const { loading, error, policies, runs, insights, reload, createPolicy, triggerRun } = useAIAutopilot();

  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    scope: 'full_stack' as 'campaigns' | 'funnels' | 'messaging' | 'full_stack',
    pauseRoiThreshold: 0,
    scaleRoiThreshold: 30,
    scaleBudgetPercent: 20,
    autoRun: false,
  });

  const latestPolicy = useMemo(() => policies[0], [policies]);

  async function onCreatePolicy(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createPolicy(policyForm);
      setPolicyForm((p) => ({ ...p, name: '', description: '' }));
      await reload();
    } finally {
      setCreating(false);
    }
  }

  async function onRunNow() {
    setRunning(true);
    try {
      await triggerRun({
        policyId: latestPolicy?.id,
        reason: 'manual_dashboard_execution',
      });
      await reload();
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell activeRoute="ai-autopilot">
      <PageHeader
        eyebrow="Module 9"
        title="AI Autopilot"
        description="Autonomous optimization engine for campaigns, funnels, and messaging. It evaluates performance signals, executes policy actions, and reports what changed with reasons."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={reload}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
            >
              Refresh
            </button>
            <button
              onClick={onRunNow}
              disabled={running}
              className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? 'Running...' : 'Run Autopilot Cycle'}
            </button>
          </div>
        }
      />

      {loading ? <p className="mt-8 text-slate-400">Loading AI Autopilot...</p> : null}
      {error ? <p className="mt-8 text-red-400">{error}</p> : null}

      {insights ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Autopilot Runs" value={String(insights.totals.autopilotRuns)} sub="last 30 days" />
          <StatCard label="Campaigns" value={String(insights.totals.campaigns)} />
          <StatCard label="Active" value={String(insights.totals.activeCampaigns)} />
          <StatCard label="Paused" value={String(insights.totals.pausedCampaigns)} />
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={onCreatePolicy} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 self-start">
          <h2 className="font-semibold text-white">Create Autopilot Policy</h2>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            placeholder="Policy name"
            value={policyForm.name}
            onChange={(e) => setPolicyForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            placeholder="Policy description"
            value={policyForm.description}
            onChange={(e) => setPolicyForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <select
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
            value={policyForm.scope}
            onChange={(e) =>
              setPolicyForm((p) => ({
                ...p,
                scope: e.target.value as 'campaigns' | 'funnels' | 'messaging' | 'full_stack',
              }))
            }
          >
            <option value="full_stack">Full Stack</option>
            <option value="campaigns">Campaigns</option>
            <option value="funnels">Funnels</option>
            <option value="messaging">Messaging</option>
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
              value={policyForm.pauseRoiThreshold}
              onChange={(e) => setPolicyForm((p) => ({ ...p, pauseRoiThreshold: Number(e.target.value) }))}
              placeholder="Pause ROI"
            />
            <input
              type="number"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
              value={policyForm.scaleRoiThreshold}
              onChange={(e) => setPolicyForm((p) => ({ ...p, scaleRoiThreshold: Number(e.target.value) }))}
              placeholder="Scale ROI"
            />
            <input
              type="number"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
              value={policyForm.scaleBudgetPercent}
              onChange={(e) => setPolicyForm((p) => ({ ...p, scaleBudgetPercent: Number(e.target.value) }))}
              placeholder="Scale %"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={policyForm.autoRun}
              onChange={(e) => setPolicyForm((p) => ({ ...p, autoRun: e.target.checked }))}
            />
            Enable Auto-Run
          </label>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? 'Saving...' : 'Save Policy'}
          </button>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">AI Insights</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-emerald-400">Working</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {(insights?.aiInsights.working || []).slice(0, 4).map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-400">Not Working</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {(insights?.aiInsights.notWorking || []).slice(0, 4).map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-sky-400">Recommendations</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {(insights?.aiInsights.recommendations || []).slice(0, 4).map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Recent Runs</h3>
            <div className="mt-4 space-y-2">
              {runs.length === 0 ? (
                <p className="text-sm text-slate-400">No autopilot runs yet.</p>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-white">{run.eventType === 'autopilot.run.completed' ? 'Completed Run' : 'Run Requested'}</p>
                      <span className="text-xs text-slate-500">{new Date(run.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Reason: {run.reason || 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Actions: {run.actionCount ?? 0}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Top Campaign ROI</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Campaign</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Spend</th>
                    <th className="pb-2 pr-4 font-medium">Revenue</th>
                    <th className="pb-2 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {(insights?.campaigns || []).map((row) => (
                    <tr key={row.campaignId} className="border-t border-white/5 text-slate-200">
                      <td className="py-2 pr-4">{row.campaignName}</td>
                      <td className="py-2 pr-4">{row.status}</td>
                      <td className="py-2 pr-4">${row.spend.toFixed(2)}</td>
                      <td className="py-2 pr-4">${row.revenue.toFixed(2)}</td>
                      <td className={`py-2 ${row.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.roi.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
