'use client';

import { useLeadEngine } from '@/hooks/useLeadEngine';

export default function LeadEnginePage() {
  const { stats, leads, loading, error, reload } = useLeadEngine();

  return (
    <main className="min-h-screen bg-[#0b0f16] text-zinc-100 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Module 1 - Lead Generation Engine</h1>
            <p className="text-sm text-zinc-400">Frontend parity for lead capture, scoring, and source analytics.</p>
          </div>
          <button onClick={reload} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">
            Refresh
          </button>
        </header>

        {loading && <p className="text-zinc-400">Loading lead engine...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {stats && (
          <section className="grid sm:grid-cols-3 gap-4">
            <Card title="Leads" value={String(stats.totals.leads)} />
            <Card title="Visitors" value={String(stats.totals.visitors)} />
            <Card title="Average Score" value={String(stats.totals.averageLeadScore)} />
          </section>
        )}

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg mb-3">Top Lead Sources</h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              {(stats?.bySource || []).map((row) => (
                <li key={row.source} className="flex justify-between">
                  <span>{row.source}</span>
                  <span>{row.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg mb-3">Recent Leads</h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              {leads.map((lead) => (
                <li key={lead.id} className="flex justify-between gap-3">
                  <span className="truncate">{lead.prospect?.fullName || lead.prospect?.email || lead.id}</span>
                  <span className="text-zinc-400">{lead.leadScore ?? '-'}</span>
                </li>
              ))}
            </ul>
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
