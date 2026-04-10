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
    loading,
    saving,
    error,
    reload,
    saveControlMode,
    saveUsageLimits,
    saveFeatureModelLimit,
    saveTenantUsageLimit,
    saveTenantFeatureModelLimit,
  } = useAdminControlCenter();

  const [featureKey, setFeatureKey] = useState('content_studio');
  const [modelIds, setModelIds] = useState('');
  const [tokensLimit, setTokensLimit] = useState<number>(16000);
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [failoverLimit, setFailoverLimit] = useState<number>(3);
  const [tenantId, setTenantId] = useState('');

  const enabledModels = useMemo(() => models.filter((m) => m.isEnabled), [models]);

  return (
    <AppShell activeRoute="admin">
      <PageHeader
        eyebrow="Admin Control Center"
        title="Unified AI, billing, tenant, and reliability controls."
        description="Switch provider mode, enforce usage/model limits, monitor health, and tune system behavior from one console."
        actions={
          <button
            onClick={reload}
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
        </div>
      )}
    </AppShell>
  );
}
