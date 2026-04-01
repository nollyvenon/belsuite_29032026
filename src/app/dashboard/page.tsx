'use client';

import Link from 'next/link';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/system/AppShell';
import { MetricCard } from '@/components/system/MetricCard';
import { PageHeader } from '@/components/system/PageHeader';
import { SectionPanel } from '@/components/system/SectionPanel';
import { ModuleLauncherGrid } from '@/components/dashboard/ModuleLauncherGrid';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { UsageTrendsChart } from '@/components/dashboard/UsageTrendsChart';
import { RevenueWidget } from '@/components/dashboard/RevenueWidget';
import { ContentPipelineStatus } from '@/components/dashboard/ContentPipelineStatus';
import { SystemHealthDashboard } from '@/components/dashboard/SystemHealthDashboard';
import { useWorkspaceOverview } from '@/hooks/useWorkspaceOverview';
import { useWorkspaceStore } from '@/stores/workspace-store';

const RANGES = [7, 14, 30, 90];

export default function DashboardPage() {
  const { rangeDays, setRangeDays } = useWorkspaceStore();
  const { overview, loading, error, reload } = useWorkspaceOverview();

  return (
    <AppShell activeRoute="dashboard">
      <PageHeader
        eyebrow="Workspace Dashboard"
        title="One operating surface for web, mobile, desktop, admin, analytics, and production workflows."
        description="Module 10 turns the existing BelSuite product surfaces into a single frontend system with a consistent shell, shared state, and typed API access."
        actions={
          <>
            <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
              {RANGES.map((days) => (
                <button
                  key={days}
                  onClick={() => setRangeDays(days)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${rangeDays === days ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <button onClick={reload} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </>
        }
      />

      {loading && !overview ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : overview ? (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <RevenueWidget />

          <UsageTrendsChart />

          <ContentPipelineStatus />

          <SystemHealthDashboard />

          <SectionPanel
            title="Module launch grid"
            subtitle="Every major product surface remains available in its dedicated route, now framed inside a consistent system layer."
            actions={
              <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
                Open admin panel
              </Link>
            }
          >
            <ModuleLauncherGrid modules={overview.modules} />
          </SectionPanel>

          <SectionPanel
            title="Operational feed"
            subtitle="High-signal summaries from billing, marketing, social, and content production."
          >
            <RecentActivityFeed items={overview.activity} />
          </SectionPanel>
        </div>
      ) : null}
    </AppShell>
  );
}