'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  RefreshCw,
  X,
  RotateCcw,
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Calendar,
  Hash,
  Globe,
} from 'lucide-react';
import type { FailedResult, PublishStats } from '@/hooks/useSocial';
import { useRetryDashboard } from '@/hooks/useSocial';
import { PlatformBadge, PLATFORM_ICONS } from './PlatformBadge';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel({ stats }: { stats: PublishStats }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <button
        onClick={() => setExpanded((x) => !x)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="font-semibold text-white">Publishing Stats (last 30 days)</h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Summary row — always visible */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Activity}
          color="bg-blue-600"
        />
        <StatCard
          label="Succeeded"
          value={stats.succeeded}
          icon={CheckCircle2}
          color="bg-emerald-600"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          sub="unacknowledged"
          icon={AlertCircle}
          color="bg-red-600"
        />
        <StatCard
          label="Success Rate"
          value={stats.successRate != null ? `${stats.successRate}%` : '—'}
          icon={stats.successRate != null && stats.successRate >= 80 ? TrendingUp : TrendingDown}
          color={
            stats.successRate == null
              ? 'bg-gray-600'
              : stats.successRate >= 80
              ? 'bg-emerald-700'
              : 'bg-orange-600'
          }
        />
      </div>

      {/* Per-platform breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {Object.entries(stats.platforms).map(([platform, rawCounts]) => {
                const counts = rawCounts as { success: number; failed: number; pending: number };
                const total = counts.success + counts.failed + counts.pending;
                const rate = total > 0 ? Math.round((counts.success / total) * 100) : null;
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-4 py-2"
                  >
                    <span className="text-lg">{PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] ?? '🌐'}</span>
                    <span className="w-28 text-sm font-medium capitalize text-gray-300">
                      {platform.charAt(0) + platform.slice(1).toLowerCase()}
                    </span>
                    <div className="flex flex-1 items-center gap-4 text-xs text-gray-400">
                      <span className="text-emerald-400">{counts.success} ok</span>
                      <span className="text-red-400">{counts.failed} failed</span>
                      {counts.pending > 0 && (
                        <span className="text-yellow-400">{counts.pending} pending</span>
                      )}
                    </div>
                    {rate != null && (
                      <span
                        className={`text-xs font-semibold ${
                          rate >= 80 ? 'text-emerald-400' : 'text-orange-400'
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Failed result card ────────────────────────────────────────────────────────

function FailedCard({
  result,
  onRetry,
  onDismiss,
}: {
  result: FailedResult;
  onRetry: () => Promise<void>;
  onDismiss: () => Promise<void>;
}) {
  const [retrying, setRetrying]   = useState(false);
  const [dismissing, setDismissing] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  }

  async function handleDismiss() {
    setDismissing(true);
    try { await onDismiss(); } finally { setDismissing(false); }
  }

  const scheduledAt = result.post.scheduledAt
    ? new Date(result.post.scheduledAt).toLocaleString()
    : 'unscheduled';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-red-500/20 bg-red-500/5 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Platform + post info */}
        <div className="flex items-start gap-3">
          <PlatformBadge platform={result.account.platform} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {result.post.content?.slice(0, 80) || '(no content)'}
              {(result.post.content?.length ?? 0) > 80 && '…'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">@{result.account.platformUsername ?? result.account.id}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{scheduledAt}</span>
              <span className="text-gray-600">·</span>
              <span>{result.attemptCount} attempt{result.attemptCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {retrying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            Retry
          </button>
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:border-white/20 hover:text-white disabled:opacity-60"
            title="Dismiss"
          >
            {dismissing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Error message */}
      {result.errorMessage && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="flex items-start gap-1.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {result.errorMessage}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main RetryView ────────────────────────────────────────────────────────────

export function RetryView() {
  const { failed, stats, loading, error, reload, retryResult, dismissResult, sortBy, setSortBy, sortOrder, setSortOrder } =
    useRetryDashboard();

  const handleSortChange = (newSortBy: 'createdAt' | 'attemptCount' | 'platform' | 'nextRetryAt') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const SortButton = ({
    sortKey,
    label,
    icon: Icon,
  }: {
    sortKey: 'createdAt' | 'attemptCount' | 'platform' | 'nextRetryAt';
    label: string;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => handleSortChange(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        sortBy === sortKey
          ? 'bg-indigo-600 text-white'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {sortBy === sortKey && (
        <ArrowUpDown className={`h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Failed Posts</h2>
          <p className="text-sm text-gray-400">
            Re-queue individual failures or dismiss them after investigating.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort by:</span>
        <SortButton sortKey="createdAt" label="Date" icon={Calendar} />
        <SortButton sortKey="attemptCount" label="Attempts" icon={Hash} />
        <SortButton sortKey="platform" label="Platform" icon={Globe} />
        <SortButton sortKey="nextRetryAt" label="Retry Time" icon={Clock} />
      </div>

      {/* Stats */}
      {stats && <StatsPanel stats={stats} />}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && failed.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/5"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && failed.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-16">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          <p className="text-base font-medium text-emerald-300">No failed posts</p>
          <p className="text-sm text-gray-500">All your recent publications went through successfully.</p>
        </div>
      )}

      {/* Failed list */}
      <AnimatePresence mode="popLayout">
        {failed.map((result) => (
          <FailedCard
            key={result.id}
            result={result}
            onRetry={() => retryResult(result.id)}
            onDismiss={() => dismissResult(result.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
