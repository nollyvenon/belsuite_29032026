'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu, Zap, DollarSign, Activity, RefreshCw, Settings, Shield,
  TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Database,
  BarChart2, List, ChevronDown, ChevronUp, Power, PowerOff, RotateCcw,
  Trash2, Save, Eye,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIModel {
  id: string;
  displayName: string;
  provider: string;
  apiIdentifier: string;
  taskTypes: string[];
  capabilities: string[];
  costPerInputToken: number;
  costPerOutputToken: number;
  qualityScore: number;
  speedScore: number;
  maxContextTokens: number;
  isEnabled: boolean;
}

interface ProviderHealth {
  modelId: string;
  modelDisplayName: string;
  provider: string;
  isHealthy: boolean;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  successRatePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalRequests: number;
  totalFailures: number;
  lastError?: string;
}

interface SystemStats {
  todayRequests: number;
  todayCostUsd: number;
  monthRequests: number;
  monthCostUsd: number;
  totalRequests: number;
  totalSavedUsd: number;
  topModelId: string | null;
  topFeature: string | null;
}

interface CacheStats {
  backend: string;
  entries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  estimatedSavedUsd: number;
  totalSizeBytes: number;
}

const PLAN_TIERS = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as const;
type PlanTier = typeof PLAN_TIERS[number];

interface BudgetConfig {
  id: string;
  organizationId: string | null;
  planTier: PlanTier | null;
  dailyLimitUsd: number | null;
  monthlyLimitUsd: number | null;
  perRequestLimitUsd: number | null;
  alertThresholdPct: number;
  blockOnExceed: boolean;
  isActive: boolean;
}

interface FeatureAssignment {
  id: string;
  feature: string;
  primaryModelId: string;
  fallbackModelId: string | null;
  routingStrategy: string;
  isActive: boolean;
}

interface RequestLog {
  id: string;
  organizationId: string;
  feature: string;
  taskType: string;
  provider: string;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  cacheHit: boolean;
  success: boolean;
  createdAt: string;
  model: { displayName: string; provider: string };
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',     label: 'Overview',      icon: BarChart2 },
  { id: 'models',       label: 'Model Registry', icon: Cpu },
  { id: 'health',       label: 'Provider Health', icon: Activity },
  { id: 'budgets',      label: 'Budgets',         icon: DollarSign },
  { id: 'assignments',  label: 'Feature Routing', icon: Zap },
  { id: 'requests',     label: 'Request Log',     icon: List },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) =>
  n < 0.01 ? `$${n.toFixed(6)}` : `$${n.toFixed(4)}`;

const circuitColor = (state: string) => ({
  CLOSED:    'text-emerald-400',
  OPEN:      'text-red-400',
  HALF_OPEN: 'text-amber-400',
}[state] ?? 'text-gray-400');

const circuitBg = (state: string) => ({
  CLOSED:    'bg-emerald-500/10 border-emerald-500/30',
  OPEN:      'bg-red-500/10 border-red-500/30',
  HALF_OPEN: 'bg-amber-500/10 border-amber-500/30',
}[state] ?? '');

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string; sub?: string; icon: any; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${
      accent
        ? 'bg-orange-500/10 border-orange-500/30'
        : 'bg-white/5 dark:bg-white/5 border-white/10 dark:border-white/10'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent ? 'text-orange-400' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${accent ? 'bg-orange-500/20' : 'bg-white/10'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-orange-400' : 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function AIGatewayDashboard() {
  const [tab, setTab]       = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data state
  const [stats, setStats]         = useState<SystemStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [models, setModels]       = useState<AIModel[]>([]);
  const [health, setHealth]       = useState<ProviderHealth[]>([]);
  const [budgets, setBudgets]     = useState<BudgetConfig[]>([]);
  const [assignments, setAssignments] = useState<FeatureAssignment[]>([]);
  const [requests, setRequests]   = useState<RequestLog[]>([]);
  const [reqTotal, setReqTotal]   = useState(0);
  const [reqPage, setReqPage]     = useState(0);

  // Budget editor
  const [editBudget, setEditBudget] = useState<Partial<BudgetConfig>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);

  const BASE = '/admin/ai-gateway';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, cs, m, h, b, a] = await Promise.all([
        fetch(`${BASE}/stats`).then(r => r.json()),
        fetch(`${BASE}/cache/stats`).then(r => r.json()),
        fetch(`${BASE}/models`).then(r => r.json()),
        fetch(`${BASE}/health`).then(r => r.json()),
        fetch(`${BASE}/budgets`).then(r => r.json()),
        fetch(`${BASE}/feature-assignments`).then(r => r.json()),
      ]);
      setStats(s); setCacheStats(cs); setModels(m);
      setHealth(h); setBudgets(b); setAssignments(a);
    } catch {/* dev mode — data not loaded yet */} finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async (page = 0) => {
    try {
      const res = await fetch(`${BASE}/requests?limit=20&offset=${page * 20}`);
      const data = await res.json();
      setRequests(data.rows ?? []);
      setReqTotal(data.total ?? 0);
      setReqPage(page);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'requests') loadRequests(0); }, [tab, loadRequests]);

  const toggleModel = async (id: string, enable: boolean) => {
    await fetch(`${BASE}/models/${id}/${enable ? 'enable' : 'disable'}`, { method: 'POST' });
    load();
  };

  const resetCircuit = async (id: string) => {
    await fetch(`${BASE}/models/${id}/reset-circuit`, { method: 'POST' });
    load();
  };

  const flushCache = async () => {
    await fetch(`${BASE}/cache/flush`, { method: 'POST' });
    load();
  };

  const saveBudget = async () => {
    setBudgetSaving(true);
    await fetch(`${BASE}/budgets`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editBudget),
    });
    setBudgetSaving(false);
    setEditBudget({});
    load();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-400" />
            AI Gateway
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Central intelligence layer — model routing, cost control &amp; observability
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-white/10 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                tab === t.id
                  ? 'text-orange-400 border-orange-400 bg-orange-500/5'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Zap}       label="Today's Requests"  value={String(stats?.todayRequests ?? '—')} sub={`$${stats?.todayCostUsd.toFixed(4) ?? '0'} cost`} />
                <StatCard icon={TrendingUp} label="Month Requests"   value={String(stats?.monthRequests ?? '—')} sub={`$${stats?.monthCostUsd.toFixed(4) ?? '0'} cost`} />
                <StatCard icon={Database}  label="Cache Saved"       value={fmtUsd(cacheStats?.estimatedSavedUsd ?? 0)} sub={`${cacheStats?.hitRate ?? 0}% hit rate`} accent />
                <StatCard icon={Shield}    label="Total Requests"    value={String(stats?.totalRequests ?? '—')} />
              </div>

              {/* Cache info */}
              {cacheStats && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database className="w-4 h-4 text-orange-400" />
                      Cache — {cacheStats.backend.toUpperCase()} backend
                    </h3>
                    <button
                      onClick={flushCache}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Flush all
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    {[
                      { label: 'Entries',   value: cacheStats.entries },
                      { label: 'Hits',      value: cacheStats.hitCount },
                      { label: 'Misses',    value: cacheStats.missCount },
                      { label: 'Hit Rate',  value: `${cacheStats.hitRate}%` },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-3">
                        <p className="text-lg font-bold text-white">{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy models summary */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-orange-400" />
                  Provider Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {health.map(h => (
                    <div
                      key={h.modelId}
                      className={`rounded-lg border p-3 ${circuitBg(h.circuitState)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{h.modelDisplayName}</span>
                        <span className={`text-xs font-mono ${circuitColor(h.circuitState)}`}>
                          {h.circuitState}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>{h.successRatePct}% OK</span>
                        <span>{h.avgLatencyMs}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MODEL REGISTRY ───────────────────────────────────────────── */}
          {tab === 'models' && (
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold">
                  {models.length} registered models
                  <span className="ml-2 text-xs text-green-400">
                    {models.filter(m => m.isEnabled).length} enabled
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left p-3">Model</th>
                      <th className="text-left p-3">Provider</th>
                      <th className="text-left p-3 hidden md:table-cell">API ID</th>
                      <th className="text-right p-3">Input $/1K</th>
                      <th className="text-right p-3">Output $/1K</th>
                      <th className="text-center p-3 hidden lg:table-cell">Quality</th>
                      <th className="text-center p-3 hidden lg:table-cell">Speed</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {models.map(m => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-medium">{m.displayName}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                            m.provider === 'OPENAI'  ? 'bg-green-500/20 text-green-400' :
                            m.provider === 'CLAUDE'  ? 'bg-purple-500/20 text-purple-400' :
                            m.provider === 'GEMINI'  ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {m.provider}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell text-gray-400 font-mono text-xs">
                          {m.apiIdentifier}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">
                          {(m.costPerInputToken * 1000).toFixed(4)}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">
                          {(m.costPerOutputToken * 1000).toFixed(4)}
                        </td>
                        <td className="p-3 text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{ width: `${m.qualityScore * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{Math.round(m.qualityScore * 100)}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${m.speedScore * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{Math.round(m.speedScore * 100)}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {m.isEnabled
                            ? <span className="text-xs text-green-400 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" />ON</span>
                            : <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />OFF</span>
                          }
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleModel(m.id, !m.isEnabled)}
                              title={m.isEnabled ? 'Disable' : 'Enable'}
                              className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            >
                              {m.isEnabled
                                ? <PowerOff className="w-3.5 h-3.5 text-red-400" />
                                : <Power className="w-3.5 h-3.5 text-green-400" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROVIDER HEALTH ───────────────────────────────────────────── */}
          {tab === 'health' && (
            <div className="space-y-3">
              {health.map(h => (
                <div
                  key={h.modelId}
                  className={`rounded-xl border p-5 ${circuitBg(h.circuitState)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{h.modelDisplayName}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${circuitBg(h.circuitState)} ${circuitColor(h.circuitState)}`}>
                          {h.circuitState}
                        </span>
                        <span className="text-xs text-gray-500">{h.provider}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: 'Success Rate', value: `${h.successRatePct}%` },
                          { label: 'Avg Latency',  value: `${h.avgLatencyMs}ms` },
                          { label: 'p95 Latency',  value: `${h.p95LatencyMs}ms` },
                          { label: 'Total Reqs',   value: String(h.totalRequests) },
                        ].map(s => (
                          <div key={s.label} className="bg-black/20 rounded-lg p-2 text-center">
                            <p className="text-white font-medium">{s.value}</p>
                            <p className="text-gray-500">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {h.lastError && (
                        <p className="mt-2 text-xs text-red-400 truncate">
                          Last error: {h.lastError}
                        </p>
                      )}
                    </div>
                    {h.circuitState !== 'CLOSED' && (
                      <button
                        onClick={() => resetCircuit(h.modelId)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BUDGETS ───────────────────────────────────────────────────── */}
          {tab === 'budgets' && (
            <div className="space-y-6">

              {/* Resolution order explanation */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
                <p className="font-medium text-white mb-1">Resolution order (highest → lowest priority)</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li><span className="text-orange-300">Org-specific</span> — overrides everything for that one tenant</li>
                  <li><span className="text-blue-300">Plan tier</span> — FREE / STARTER / PROFESSIONAL / ENTERPRISE</li>
                  <li><span className="text-gray-300">Global default</span> — fallback for any org without a closer match</li>
                </ol>
              </div>

              {/* Existing configs grouped by scope */}
              <div className="space-y-3">
                {budgets.map(b => {
                  const scopeLabel = b.organizationId
                    ? `Org: ${b.organizationId}`
                    : b.planTier
                    ? `Plan: ${b.planTier}`
                    : '🌐 Global default';
                  const scopeColor = b.organizationId
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                    : b.planTier
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-white/5 border-white/10 text-gray-300';

                  return (
                    <div key={b.id} className={`rounded-xl border p-5 ${scopeColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">{scopeLabel}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${b.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                            {b.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {b.blockOnExceed && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              Hard block
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-gray-400 mb-0.5">Daily limit</p>
                          <p className="font-mono text-white">{b.dailyLimitUsd ? `$${b.dailyLimitUsd}` : '—'}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-gray-400 mb-0.5">Monthly limit</p>
                          <p className="font-mono text-white">{b.monthlyLimitUsd ? `$${b.monthlyLimitUsd}` : '—'}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-gray-400 mb-0.5">Per-request</p>
                          <p className="font-mono text-white">{b.perRequestLimitUsd ? `$${b.perRequestLimitUsd}` : '—'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditBudget(b)}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Budget editor */}
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-400" />
                  {editBudget.id ? 'Edit budget config' : 'New budget config'}
                </h3>
                <p className="text-xs text-gray-400 mb-5">
                  Set one scope field. Leave both blank for the global default.
                </p>

                {/* Scope selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Organization ID
                      <span className="ml-1 text-gray-500">(org-specific override)</span>
                    </label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                      placeholder="org_xxxx — leave blank if using plan tier"
                      value={editBudget.organizationId ?? ''}
                      onChange={e => setEditBudget(p => ({
                        ...p,
                        organizationId: e.target.value || null,
                        planTier: e.target.value ? null : p.planTier,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Plan tier
                      <span className="ml-1 text-gray-500">(applies to all orgs on this plan)</span>
                    </label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                      value={editBudget.planTier ?? ''}
                      disabled={!!editBudget.organizationId}
                      onChange={e => setEditBudget(p => ({ ...p, planTier: (e.target.value as PlanTier) || null }))}
                    >
                      <option value="">— none (global) —</option>
                      {PLAN_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Daily limit (USD)</label>
                    <input
                      type="number" step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g. 5.00"
                      value={editBudget.dailyLimitUsd ?? ''}
                      onChange={e => setEditBudget(p => ({ ...p, dailyLimitUsd: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Monthly limit (USD)</label>
                    <input
                      type="number" step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g. 50.00"
                      value={editBudget.monthlyLimitUsd ?? ''}
                      onChange={e => setEditBudget(p => ({ ...p, monthlyLimitUsd: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Per-request limit (USD)</label>
                    <input
                      type="number" step="0.001"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g. 0.02"
                      value={editBudget.perRequestLimitUsd ?? ''}
                      onChange={e => setEditBudget(p => ({ ...p, perRequestLimitUsd: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                </div>

                {/* Behaviour toggles */}
                <div className="flex flex-wrap items-center gap-6 mb-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-orange-500"
                      checked={editBudget.blockOnExceed ?? false}
                      onChange={e => setEditBudget(p => ({ ...p, blockOnExceed: e.target.checked }))}
                    />
                    <span>Hard block when limit exceeded</span>
                    <span className="text-xs text-gray-500">(otherwise just warns)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-orange-500"
                      checked={editBudget.isActive ?? true}
                      onChange={e => setEditBudget(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveBudget}
                    disabled={budgetSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {budgetSaving ? 'Saving…' : 'Save config'}
                  </button>
                  {editBudget.id && (
                    <button
                      onClick={() => setEditBudget({})}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURE ASSIGNMENTS ───────────────────────────────────────── */}
          {tab === 'assignments' && (
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold">Feature → Model routing</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Override which model handles each BelSuite feature
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left p-3">Feature</th>
                      <th className="text-left p-3">Primary Model</th>
                      <th className="text-left p-3 hidden md:table-cell">Fallback</th>
                      <th className="text-left p-3 hidden lg:table-cell">Strategy</th>
                      <th className="text-center p-3">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assignments.map(a => {
                      const primary  = models.find(m => m.id === a.primaryModelId);
                      const fallback = models.find(m => m.id === a.fallbackModelId);
                      return (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono text-xs text-orange-300">{a.feature}</td>
                          <td className="p-3">{primary?.displayName ?? a.primaryModelId}</td>
                          <td className="p-3 hidden md:table-cell text-gray-400">
                            {fallback?.displayName ?? '—'}
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10">
                              {a.routingStrategy}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {a.isActive
                              ? <CheckCircle className="w-4 h-4 text-green-400 inline" />
                              : <XCircle className="w-4 h-4 text-gray-500 inline" />
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REQUEST LOG ───────────────────────────────────────────────── */}
          {tab === 'requests' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold">Request log — {reqTotal} total</h3>
                  <button onClick={() => loadRequests(0)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left p-3">Time</th>
                        <th className="text-left p-3">Feature</th>
                        <th className="text-left p-3 hidden sm:table-cell">Model</th>
                        <th className="text-right p-3 hidden md:table-cell">Tokens</th>
                        <th className="text-right p-3">Cost</th>
                        <th className="text-right p-3 hidden lg:table-cell">Latency</th>
                        <th className="text-center p-3">Cache</th>
                        <th className="text-center p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-gray-400">
                            {new Date(r.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="p-3 font-mono text-orange-300">{r.feature}</td>
                          <td className="p-3 hidden sm:table-cell">{r.model?.displayName ?? r.provider}</td>
                          <td className="p-3 text-right hidden md:table-cell font-mono">{r.totalTokens.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">{fmtUsd(r.costUsd)}</td>
                          <td className="p-3 text-right hidden lg:table-cell">{r.latencyMs}ms</td>
                          <td className="p-3 text-center">
                            {r.cacheHit
                              ? <span className="text-xs text-emerald-400">HIT</span>
                              : <span className="text-xs text-gray-500">MISS</span>
                            }
                          </td>
                          <td className="p-3 text-center">
                            {r.success
                              ? <CheckCircle className="w-3.5 h-3.5 text-green-400 inline" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs">
                  <span className="text-gray-400">
                    Page {reqPage + 1} of {Math.ceil(reqTotal / 20)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={reqPage === 0}
                      onClick={() => loadRequests(reqPage - 1)}
                      className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={(reqPage + 1) * 20 >= reqTotal}
                      onClick={() => loadRequests(reqPage + 1)}
                      className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
