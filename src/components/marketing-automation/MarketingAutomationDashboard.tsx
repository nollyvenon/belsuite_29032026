'use client';

import { useMemo, useState } from 'react';
import { useMarketingAutomation } from '@/hooks/useMarketingAutomation';

export function MarketingAutomationDashboard() {
  const { stats, campaigns, loading, error, reload, generateCopy } = useMarketingAutomation();
  const [copyOutput, setCopyOutput] = useState<Record<string, unknown> | null>(null);
  const [generating, setGenerating] = useState(false);

  const activeCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.isActive),
    [campaigns],
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateCopy({
        objective: 'book more qualified demos',
        offer: 'AI growth automation sprint',
        audience: 'B2B SaaS founders',
        channel: 'email',
        tone: 'direct',
        variantCount: 3,
      });
      setCopyOutput(result);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Module 4 - Omni-Channel Marketing Automation</h1>
          <p className="text-sm text-zinc-400">Campaign builder backend, queue execution, provider callbacks, and AI copy automation.</p>
        </div>
        <button onClick={() => { void reload(); }} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm">
          Refresh
        </button>
      </header>

      {loading && <p className="text-zinc-400">Loading marketing automation...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {stats && (
        <section className="grid sm:grid-cols-5 gap-4">
          <Card title="Campaigns" value={String(stats.totals.campaigns)} />
          <Card title="Active" value={String(stats.totals.activeCampaigns)} />
          <Card title="Runs" value={String(stats.totals.runs)} />
          <Card title="Triggered" value={String(stats.totals.triggeredRuns)} />
          <Card title="Messages" value={String(stats.totals.messagesSent)} />
        </section>
      )}

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h2 className="text-lg mb-3">Campaigns</h2>
          <ul className="space-y-2 text-sm">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                <span className="truncate">{campaign.name}</span>
                <span className={campaign.isActive ? 'text-emerald-400' : 'text-zinc-500'}>
                  {campaign.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500 mt-3">Active campaigns: {activeCampaigns.length}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h2 className="text-lg mb-3">AI Copy Generator</h2>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded text-sm disabled:opacity-60"
          >
            {generating ? 'Generating...' : 'Generate Campaign Copy'}
          </button>
          <pre className="mt-3 text-xs text-zinc-300 bg-black/30 p-3 rounded overflow-auto max-h-72">
            {copyOutput ? JSON.stringify(copyOutput, null, 2) : 'No output yet.'}
          </pre>
        </div>
      </section>
    </div>
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
