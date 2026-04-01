'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  RefreshCw,
  ChevronRight,
  Clock,
  Target,
} from 'lucide-react';
import {
  useAICeoDashboard,
  useGenerateDecision,
  useApplyDecision,
  useDecisionHistory,
  useGenerateReport,
  AICeoDecision,
  DecisionType,
} from '../../hooks/useAICeo';

const DECISION_TYPES: { value: DecisionType; label: string; icon: React.ElementType }[] = [
  { value: 'revenue_optimization', label: 'Revenue Optimization', icon: DollarSign },
  { value: 'pricing_adjustment', label: 'Pricing Adjustment', icon: BarChart3 },
  { value: 'churn_mitigation', label: 'Churn Mitigation', icon: TrendingDown },
  { value: 'feature_recommendation', label: 'Feature Recommendation', icon: Zap },
  { value: 'growth_strategy', label: 'Growth Strategy', icon: TrendingUp },
];

const SEVERITY_COLORS = {
  low: 'text-green-400 bg-green-400/10 border-green-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
};

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && (
        <div
          className={`text-xs mt-1 flex items-center gap-1 ${
            trend === 'up'
              ? 'text-green-400'
              : trend === 'down'
                ? 'text-red-400'
                : 'text-slate-500'
          }`}
        >
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {sub}
        </div>
      )}
    </div>
  );
}

function DecisionCard({
  decision,
  onApply,
  applying,
}: {
  decision: AICeoDecision;
  onApply: (id: string) => void;
  applying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityClass = SEVERITY_COLORS[decision.severity] || SEVERITY_COLORS.low;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${severityClass}`}
            >
              {decision.severity.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {decision.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-500 ml-auto">
              {Math.round(decision.confidence * 100)}% confidence
            </span>
          </div>
          <h3 className="font-semibold text-white">{decision.title}</h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{decision.description}</p>
        </div>
      </div>

      {decision.estimatedImpact && (
        <div className="mt-3 bg-slate-900/50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Estimated Impact</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">{decision.estimatedImpact.metric}</span>
            <span className="text-slate-500">→</span>
            <span
              className={
                decision.estimatedImpact.percentChange >= 0 ? 'text-green-400' : 'text-red-400'
              }
            >
              {decision.estimatedImpact.percentChange >= 0 ? '+' : ''}
              {decision.estimatedImpact.percentChange.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <button
        className="text-xs text-purple-400 mt-3 hover:text-purple-300 transition flex items-center gap-1"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide' : 'Show'} details
        <ChevronRight
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Recommendation</div>
            <p className="text-sm text-slate-300">{decision.recommendation}</p>
          </div>
          {decision.implementationSteps?.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Implementation Steps</div>
              <ol className="space-y-1">
                {decision.implementationSteps.map((step, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-purple-400 font-medium shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onApply(decision.id)}
        disabled={applying}
        className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-2 rounded-lg transition"
      >
        {applying ? 'Applying...' : 'Apply Decision'}
      </button>
    </div>
  );
}

export default function AICeoPage() {
  // Use a demo org ID — in production this comes from auth context
  const orgId = 'demo-org-id';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generate' | 'history'>('dashboard');
  const [selectedType, setSelectedType] = useState<DecisionType>('revenue_optimization');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [generatedDecision, setGeneratedDecision] = useState<AICeoDecision | null>(null);

  const { data: dashboard, loading: dashLoading, error: dashError, refetch } = useAICeoDashboard(orgId);
  const { generate, loading: genLoading, error: genError } = useGenerateDecision();
  const { apply } = useApplyDecision();
  const { data: history, loading: histLoading, refetch: fetchHistory } = useDecisionHistory(orgId);
  const { generate: generateReport, loading: reportLoading } = useGenerateReport();

  useEffect(() => {
    if (activeTab === 'dashboard') refetch();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const handleApply = async (decisionId: string) => {
    setApplyingId(decisionId);
    const ok = await apply(orgId, decisionId);
    setApplyingId(null);
    if (ok) refetch();
  };

  const handleGenerate = async () => {
    const decision = await generate(orgId, selectedType);
    if (decision) setGeneratedDecision(decision);
  };

  const handleGenerateReport = async (frequency: 'daily' | 'weekly' | 'monthly') => {
    await generateReport(orgId, frequency);
    refetch();
  };

  const metrics = dashboard?.currentMetrics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-500/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI CEO</h1>
              <p className="text-xs text-slate-400">Autonomous Business Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dashboard?.healthCheck && (
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                <CheckCircle className="w-3 h-3" />
                {dashboard.healthCheck.status}
              </div>
            )}
            <button
              onClick={refetch}
              disabled={dashLoading}
              className="p-2 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit mb-6">
          {(['dashboard', 'generate', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition capitalize ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ---- DASHBOARD TAB ---- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {dashError && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {dashError}
              </div>
            )}

            {/* KPI Grid */}
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Key Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard
                  label="MRR"
                  value={`$${((metrics?.monthlyRecurringRevenue ?? 0) / 1000).toFixed(1)}k`}
                  sub={`${metrics?.revenueGrowth?.toFixed(1) ?? 0}% growth`}
                  trend={metrics && metrics.revenueGrowth > 0 ? 'up' : 'down'}
                  icon={DollarSign}
                />
                <MetricCard
                  label="Churn Rate"
                  value={`${(metrics?.churnRate ?? 0).toFixed(1)}%`}
                  sub={`${metrics?.churned30Days ?? 0} churned (30d)`}
                  trend={metrics && metrics.churnRate < 5 ? 'up' : 'down'}
                  icon={TrendingDown}
                />
                <MetricCard
                  label="Active Subs"
                  value={(metrics?.activeSubscriptions ?? 0).toLocaleString()}
                  icon={Users}
                />
                <MetricCard
                  label="LTV:CAC"
                  value={`${(
                    (metrics?.customerLifetimeValue ?? 0) /
                    Math.max(metrics?.customerAcquisitionCost ?? 1, 1)
                  ).toFixed(1)}x`}
                  sub="Lifetime Value / Acquisition Cost"
                  icon={Target}
                />
                <MetricCard
                  label="Total Revenue"
                  value={`$${((metrics?.totalRevenue ?? 0) / 1000).toFixed(1)}k`}
                  icon={BarChart3}
                />
                <MetricCard
                  label="Conversion Rate"
                  value={`${(metrics?.conversionRate ?? 0).toFixed(1)}%`}
                  icon={Activity}
                />
                {dashboard?.healthCheck && (
                  <MetricCard
                    label="AI Success Rate"
                    value={`${dashboard.healthCheck.successRate}%`}
                    icon={Brain}
                  />
                )}
                {dashboard?.healthCheck && (
                  <MetricCard
                    label="Last Analysis"
                    value={new Date(dashboard.healthCheck.lastAnalysisTime).toLocaleDateString()}
                    icon={Clock}
                  />
                )}
              </div>
            </div>

            {/* Report generation buttons */}
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Generate Report
              </h2>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleGenerateReport(freq)}
                    disabled={reportLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-lg transition disabled:opacity-50 capitalize"
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Decisions */}
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Active Decisions{' '}
                {dashboard?.activeDecisions?.length ? `(${dashboard.activeDecisions.length})` : ''}
              </h2>
              {dashLoading ? (
                <div className="text-slate-500 text-sm">Loading decisions...</div>
              ) : dashboard?.activeDecisions?.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {dashboard.activeDecisions.map((d) => (
                    <DecisionCard
                      key={d.id}
                      decision={d}
                      onApply={handleApply}
                      applying={applyingId === d.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm bg-slate-800/30 rounded-lg p-6 text-center">
                  No active decisions. Go to the &quot;Generate&quot; tab to create new AI
                  recommendations.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- GENERATE TAB ---- */}
        {activeTab === 'generate' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Select Analysis Type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DECISION_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedType(value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                      selectedType === value
                        ? 'border-purple-500 bg-purple-600/20 text-white'
                        : 'border-slate-700/50 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition"
            >
              {genLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {genLoading ? 'Analyzing...' : 'Generate AI Decision'}
            </button>

            {genError && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {genError}
              </div>
            )}

            {generatedDecision && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                  Generated Decision
                </h2>
                <DecisionCard
                  decision={generatedDecision}
                  onApply={handleApply}
                  applying={applyingId === generatedDecision.id}
                />
              </motion.div>
            )}
          </div>
        )}

        {/* ---- HISTORY TAB ---- */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
              Implemented Decisions
            </h2>
            {histLoading ? (
              <div className="text-slate-500 text-sm">Loading history...</div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((d) => (
                  <div
                    key={d.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{d.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.type.replace(/_/g, ' ')} •{' '}
                        {new Date(d.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.low
                      }`}
                    >
                      {d.severity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm bg-slate-800/30 rounded-lg p-6 text-center">
                No implemented decisions yet. Apply decisions from the Dashboard tab to track
                their impact here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
