'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/system/AppShell';
import { PageHeader } from '@/components/system/PageHeader';
import { SectionPanel } from '@/components/system/SectionPanel';
import { MetricCard } from '@/components/system/MetricCard';
import { useAdminControlCenter } from '@/hooks/useAdminControlCenter';

export default function AdminControlCenterPage() {
  const {
    dashboard,
    usageLimits,
    featureModelLimits,
    models,
    tenants,
    tenantUsageLimits,
    tenantFeatureModelLimits,
    taskCatalog,
    taskRoutes,
    usageTimeline,
    usageTimelineSource,
    taskMetrics,
    loading,
    saving,
    error,
    reload,
    saveControlMode,
    saveUsageLimits,
    saveFeatureModelLimit,
    saveTenantUsageLimit,
    saveTenantFeatureModelLimit,
    saveTaskCatalogEntry,
    saveTaskRoute,
    removeTaskCatalogEntry,
    removeTaskRoute,
  } = useAdminControlCenter();

  const [featureKey, setFeatureKey] = useState('content_studio');
  const [modelIds, setModelIds] = useState('');
  const [tokensLimit, setTokensLimit] = useState<number>(16000);
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [failoverLimit, setFailoverLimit] = useState<number>(3);
  const [tenantId, setTenantId] = useState('');
  const [routeTask, setRouteTask] = useState('');
  const [routePrimaryModel, setRoutePrimaryModel] = useState('');
  const [routeFallbackModels, setRouteFallbackModels] = useState<string[]>([]);
  const [routeStrategy, setRouteStrategy] = useState<'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom'>('balanced');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [taskEdits, setTaskEdits] = useState<Record<string, { displayName: string; description: string }>>({});

  const enabledModels = useMemo(() => models.filter((m) => m.isEnabled), [models]);

  const handleReload = async () => {
    await reload();
    setBanner(null);
  };

  return (
    <AppShell activeRoute="admin">
      <PageHeader
        eyebrow="Admin Control Center"
        title="Unified AI, billing, tenant, and reliability controls."
        description="Switch provider mode, enforce usage/model limits, monitor health, and tune system behavior from one console."
        actions={
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {loading && !dashboard ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tenants" value={String(tenants.length)} detail="managed organizations" accent="sky" />
            <MetricCard label="AI Requests Today" value={String(dashboard?.stats?.todayRequests ?? 0)} detail={`$${dashboard?.stats?.todayCostUsd ?? 0} cost`} accent="amber" />
            <MetricCard label="Healthy Models" value={`${dashboard?.healthSummary?.healthy ?? 0}/${dashboard?.healthSummary?.total ?? 0}`} detail={`${dashboard?.healthSummary?.openCircuits ?? 0} circuits open`} accent="emerald" />
            <MetricCard label="Current Mode" value={dashboard?.profile?.mode ?? 'BALANCED'} detail={dashboard?.profile?.dynamicEnabled ? 'dynamic enabled' : 'dynamic disabled'} accent="violet" />
          </div>
          {banner && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${
              banner.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/20 bg-red-500/10 text-red-200'
            }`}>
              {banner.message}
            </div>
          )}

          <SectionPanel title="Dynamic AI mode" subtitle="Switch between low-cost and premium routing at runtime.">
            <div className="flex flex-wrap gap-3">
              {(['CHEAP', 'BALANCED', 'PREMIUM'] as const).map((mode) => (
                <button
                  key={mode}
                  disabled={saving}
                  onClick={() => saveControlMode(mode)}
                  className={`rounded-xl px-4 py-2 text-sm ${
                    dashboard?.profile?.mode === mode
                      ? 'bg-amber-300 text-black'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="Usage limits" subtitle="Admin-enforced limits for tokens, batch operations, and failover chain size.">
            <div className="grid gap-4 md:grid-cols-3">
              <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" type="number" value={tokensLimit} onChange={(e) => setTokensLimit(Number(e.target.value))} placeholder={`max tokens (${usageLimits?.maxTokensPerRequest ?? 16000})`} />
              <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" type="number" value={batchLimit} onChange={(e) => setBatchLimit(Number(e.target.value))} placeholder={`max batch (${usageLimits?.maxBatchRequests ?? 10})`} />
              <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" type="number" value={failoverLimit} onChange={(e) => setFailoverLimit(Number(e.target.value))} placeholder={`max failover (${usageLimits?.maxFailoverModels ?? 3})`} />
            </div>
            <button
              disabled={saving}
              onClick={() =>
                saveUsageLimits({
                  maxTokensPerRequest: tokensLimit,
                  maxBatchRequests: batchLimit,
                  maxFailoverModels: failoverLimit,
                })
              }
              className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black"
            >
              Save usage limits
            </button>
          </SectionPanel>

          <SectionPanel title="Feature model limits" subtitle="Restrict specific features to selected model IDs only.">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={featureKey}
                onChange={(e) => setFeatureKey(e.target.value)}
                placeholder="feature key"
              />
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:col-span-2"
                value={modelIds}
                onChange={(e) => setModelIds(e.target.value)}
                placeholder="comma-separated model IDs"
              />
            </div>
            <button
              disabled={saving}
              onClick={() =>
                saveFeatureModelLimit(
                  featureKey,
                  modelIds
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="mt-4 rounded-xl bg-amber-300 px-4 py-2 text-sm font-medium text-black"
            >
              Save feature model limit
            </button>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <p className="font-medium text-white">Enabled models</p>
              <p className="mt-1">{enabledModels.map((m) => `${m.displayName} (${m.id})`).join(' | ') || 'No enabled models found'}</p>
              <p className="mt-3 font-medium text-white">Current feature limits</p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify(featureModelLimits, null, 2)}</pre>
            </div>
          </SectionPanel>

          <SectionPanel title="Tenant-specific overrides" subtitle="Override global limits and model constraints for one tenant.">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="tenant/organization ID"
              />
              <button
                disabled={saving || !tenantId}
                onClick={() =>
                  saveTenantUsageLimit(tenantId, {
                    maxTokensPerRequest: tokensLimit,
                    maxBatchRequests: batchLimit,
                    maxFailoverModels: failoverLimit,
                  })
                }
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-black"
              >
                Save tenant usage limits
              </button>
              <button
                disabled={saving || !tenantId}
                onClick={() =>
                  saveTenantFeatureModelLimit(
                    tenantId,
                    featureKey,
                    modelIds
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-black"
              >
                Save tenant feature-model limit
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <p className="font-medium text-white">Tenant usage limit map</p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify(tenantUsageLimits, null, 2)}</pre>
              <p className="mt-3 font-medium text-white">Tenant feature-model limit map</p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify(tenantFeatureModelLimits, null, 2)}</pre>
            </div>
          </SectionPanel>

          <SectionPanel title="Task catalog and routes" subtitle="Control task definitions and explicit primary/fallback model routing.">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">Task catalog</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {taskMetrics.slice(0, 8).map((m) => (
                    <MetricCard
                      key={m.taskKey}
                      label={m.taskKey}
                      value={`${m.successRatePct.toFixed(1)}% SLA`}
                      detail={`${m.avgLatencyMs}ms avg | $${m.totalCostUsd.toFixed(4)}`}
                      accent="emerald"
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {taskCatalog.map((task) => (
                    <div key={task.taskKey} className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const editedDisplayName = taskEdits[task.taskKey]?.displayName ?? task.displayName;
                        const editedDescription = taskEdits[task.taskKey]?.description ?? task.description ?? '';
                        const originalDescription = task.description ?? '';
                        const isDirty =
                          editedDisplayName !== task.displayName ||
                          editedDescription !== originalDescription;
                        return (
                          <>
                      <span className="min-w-[180px] text-xs text-slate-300">{task.taskKey}</span>
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs min-w-[180px]"
                        value={taskEdits[task.taskKey]?.displayName ?? task.displayName}
                        onChange={(e) =>
                          setTaskEdits((prev) => ({
                            ...prev,
                            [task.taskKey]: {
                              displayName: e.target.value,
                              description: prev[task.taskKey]?.description ?? task.description ?? '',
                            },
                          }))
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs min-w-[260px]"
                        value={taskEdits[task.taskKey]?.description ?? task.description ?? ''}
                        onChange={(e) =>
                          setTaskEdits((prev) => ({
                            ...prev,
                            [task.taskKey]: {
                              displayName: prev[task.taskKey]?.displayName ?? task.displayName,
                              description: e.target.value,
                            },
                          }))
                        }
                      />
                      <button
                        disabled={saving || !isDirty}
                        onClick={async () => {
                          try {
                            await saveTaskCatalogEntry({
                              ...task,
                              displayName: taskEdits[task.taskKey]?.displayName ?? task.displayName,
                              description: taskEdits[task.taskKey]?.description ?? task.description ?? '',
                            });
                            setBanner({ type: 'success', message: `Saved task "${task.taskKey}"` });
                          } catch (e) {
                            setBanner({ type: 'error', message: (e as Error).message || 'Failed to save task' });
                          }
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-medium ${
                          saving || !isDirty
                            ? 'bg-white/10 text-slate-400'
                            : 'bg-amber-300 text-black'
                        }`}
                      >
                        Save
                      </button>
                      {isDirty && (
                        <span className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-200">
                          unsaved changes
                        </span>
                      )}
                      <button
                        disabled={saving}
                        onClick={async () => {
                          try {
                            await saveTaskCatalogEntry({ ...task, isActive: !task.isActive });
                            setBanner({ type: 'success', message: `Updated task "${task.taskKey}"` });
                          } catch (e) {
                            setBanner({ type: 'error', message: (e as Error).message || 'Failed to update task' });
                          }
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-medium ${
                          task.isActive ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {task.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        disabled={saving}
                        onClick={async () => {
                          try {
                            await removeTaskCatalogEntry(task.taskKey);
                            setBanner({ type: 'success', message: `Deleted task "${task.taskKey}"` });
                          } catch (e) {
                            setBanner({ type: 'error', message: (e as Error).message || 'Failed to delete task' });
                          }
                        }}
                        className="rounded-xl bg-red-500/70 px-3 py-2 text-xs font-medium text-white"
                      >
                        Delete
                      </button>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">Task route editor</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    value={routeTask}
                    onChange={(e) => {
                      const key = e.target.value;
                      setRouteTask(key);
                      const route = taskRoutes[key];
                      setRoutePrimaryModel(route?.primaryModelId ?? '');
                      setRouteFallbackModels(route?.fallbackModelIds ?? []);
                      setRouteStrategy(route?.strategy ?? 'balanced');
                    }}
                  >
                    <option value="">select task</option>
                    {taskCatalog.map((t) => (
                      <option key={t.taskKey} value={t.taskKey}>
                        {t.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    value={routePrimaryModel}
                    onChange={(e) => setRoutePrimaryModel(e.target.value)}
                  >
                    <option value="">primary model</option>
                    {enabledModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    value={routeStrategy}
                    onChange={(e) => setRouteStrategy(e.target.value as 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom')}
                  >
                    {['cheapest', 'fastest', 'best_quality', 'balanced', 'custom'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    multiple
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm min-h-[110px]"
                    value={routeFallbackModels}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setRouteFallbackModels(selected);
                    }}
                  >
                    {enabledModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={saving || !routeTask || !routePrimaryModel}
                  onClick={async () => {
                    try {
                      await saveTaskRoute(routeTask, {
                        primaryModelId: routePrimaryModel,
                        fallbackModelIds: routeFallbackModels,
                        strategy: routeStrategy,
                        isActive: true,
                      });
                      setBanner({ type: 'success', message: `Saved task route for "${routeTask}"` });
                    } catch (e) {
                      setBanner({ type: 'error', message: (e as Error).message || 'Failed to save task route' });
                    }
                  }}
                  className="mt-3 rounded-xl bg-amber-300 px-4 py-2 text-sm font-medium text-black"
                >
                  Save task route
                </button>
                {routeTask && (
                  <button
                    disabled={saving}
                    onClick={async () => {
                      try {
                        await removeTaskRoute(routeTask);
                        setBanner({ type: 'success', message: `Deleted task route for "${routeTask}"` });
                      } catch (e) {
                        setBanner({ type: 'error', message: (e as Error).message || 'Failed to delete task route' });
                      }
                    }}
                    className="mt-3 ml-2 rounded-xl bg-red-500/70 px-4 py-2 text-sm font-medium text-white"
                  >
                    Delete task route
                  </button>
                )}
                <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                  {JSON.stringify(taskRoutes, null, 2)}
                </pre>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="AI usage trend (30 days)" subtitle={`Source: ${usageTimelineSource}`}>
            <div className="space-y-2">
              {usageTimeline.length === 0 ? (
                <p className="text-sm text-slate-400">No usage data yet.</p>
              ) : (
                usageTimeline.map((point) => {
                  const max = Math.max(...usageTimeline.map((p) => p.costUsd || 0.0001));
                  const pct = Math.max(2, Math.round((point.costUsd / max) * 100));
                  return (
                    <div key={point.day} className="grid grid-cols-[100px_1fr_120px] items-center gap-3 text-xs">
                      <span className="text-slate-400">{point.day}</span>
                      <div className="h-3 rounded bg-white/10">
                        <div className="h-3 rounded bg-amber-400/80" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-slate-200">${point.costUsd.toFixed(4)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </SectionPanel>
        </div>
      )}
    </AppShell>
  );
}
