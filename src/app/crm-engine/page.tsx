'use client';

import { useCrmEngine } from '@/hooks/useCrmEngine';

export default function CrmEnginePage() {
  const { stats, pipeline, loading, error, reload } = useCrmEngine();

  return (
    <main className="min-h-screen bg-[#0c1018] text-zinc-100 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Module 3 - CRM Conversion Engine</h1>
            <p className="text-sm text-zinc-400">Frontend parity for pipeline visibility and conversion metrics.</p>
          </div>
          <button onClick={reload} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm">
            Refresh
          </button>
        </header>

        {loading && <p className="text-zinc-400">Loading CRM engine...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {stats && (
          <section className="grid sm:grid-cols-4 gap-4">
            <Card title="Pipeline Leads" value={String(stats.totals.leadsInPipeline)} />
            <Card title="Converted" value={String(stats.totals.converted)} />
            <Card title="Conversion Rate" value={`${stats.totals.conversionRate}%`} />
            <Card title="Win Rate" value={`${stats.totals.winRate}%`} />
          </section>
        )}

        <section className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h2 className="text-lg mb-3">Pipeline</h2>
          <div className="space-y-2 text-sm">
            {pipeline.map((lead) => (
              <div key={lead.crmLeadId} className="grid grid-cols-4 gap-3 border-b border-white/5 pb-2">
                <span className="truncate">{lead.fullName || lead.email || lead.crmLeadId}</span>
                <span>{lead.stage}</span>
                <span>{lead.score}</span>
                <span>{lead.companyName || '-'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
