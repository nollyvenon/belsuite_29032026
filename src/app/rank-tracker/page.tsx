'use client';
import { useEffect, useState } from 'react';
import { KeywordRank, KeywordSuggestion, useRankTracker } from '../../hooks/useRankTracker';

export default function RankTrackerPage() {
  const { loading, error, listRanks, getStats, trackKeyword, bulkTrack, research } = useRankTracker();
  const [ranks, setRanks] = useState<KeywordRank[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ uniqueKeywords: number; top10Rankings: number; top3Rankings: number; avgPosition: number | null } | null>(null);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [tab, setTab] = useState<'tracker' | 'research'>('tracker');

  // Track form
  const [trackForm, setTrackForm] = useState({ keyword: '', domain: '', country: 'us' });
  // Bulk track
  const [bulkForm, setBulkForm] = useState({ domain: '', keywords: '', country: 'us' });
  // Research form
  const [researchForm, setResearchForm] = useState({ seedKeyword: '', industry: '', country: 'us', count: '20' });

  const reload = async () => {
    const [r, s] = await Promise.all([listRanks(), getStats()]);
    setRanks(r.items);
    setTotal(r.total);
    setStats(s);
  };

  useEffect(() => { reload(); }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await trackKeyword(trackForm);
    setTrackForm({ keyword: '', domain: trackForm.domain, country: trackForm.country });
    reload();
  };

  const handleBulkTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = bulkForm.keywords.split('\n').map((k) => k.trim()).filter(Boolean);
    await bulkTrack({ domain: bulkForm.domain, keywords, country: bulkForm.country });
    setBulkForm((p) => ({ ...p, keywords: '' }));
    reload();
  };

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await research({ ...researchForm, count: Number(researchForm.count) });
    setSuggestions(res.suggestions);
  };

  const mvColor = (m?: number) => !m ? 'text-gray-400' : m > 0 ? 'text-green-600' : 'text-red-500';
  const diffColor = (d?: number) => !d ? '' : d < 30 ? 'text-green-600' : d < 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rank Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ahrefs-style keyword rank tracking & research</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tracked Keywords', value: String(stats.uniqueKeywords) },
            { label: 'Top 3 Rankings', value: String(stats.top3Rankings) },
            { label: 'Top 10 Rankings', value: String(stats.top10Rankings) },
            { label: 'Avg Position', value: stats.avgPosition ? String(stats.avgPosition) : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tracker', 'research'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {t === 'tracker' ? 'Rank Tracker' : 'AI Research'}
          </button>
        ))}
      </div>

      {tab === 'tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add forms */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Track Keyword</h3>
              <form onSubmit={handleTrack} className="space-y-2">
                {[
                  { key: 'keyword', label: 'Keyword', placeholder: 'e.g. best crm software' },
                  { key: 'domain', label: 'Domain', placeholder: 'e.g. example.com' },
                  { key: 'country', label: 'Country', placeholder: 'us' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500">{label}</label>
                    <input
                      className="w-full mt-0.5 border rounded-lg px-3 py-1.5 text-sm"
                      placeholder={placeholder}
                      value={(trackForm as Record<string, string>)[key]}
                      onChange={(e) => setTrackForm((p) => ({ ...p, [key]: e.target.value }))}
                      required={key !== 'country'}
                    />
                  </div>
                ))}
                <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 mt-1">Track</button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Bulk Track</h3>
              <form onSubmit={handleBulkTrack} className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Domain</label>
                  <input className="w-full mt-0.5 border rounded-lg px-3 py-1.5 text-sm" value={bulkForm.domain} onChange={(e) => setBulkForm((p) => ({ ...p, domain: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Keywords (one per line)</label>
                  <textarea className="w-full mt-0.5 border rounded-lg px-3 py-1.5 text-sm h-24" value={bulkForm.keywords} onChange={(e) => setBulkForm((p) => ({ ...p, keywords: e.target.value }))} />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">Bulk Track</button>
              </form>
            </div>
          </div>

          {/* Rankings table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Tracked Rankings ({total})</h3>
              {loading && <span className="text-xs text-gray-400">Loading...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Keyword', 'Domain', 'Position', 'Move', 'Volume', 'Diff', 'Date'].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ranks.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.keyword}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.domain}</td>
                      <td className="px-4 py-2.5 font-bold text-gray-900">{r.position ?? '—'}</td>
                      <td className={`px-4 py-2.5 font-medium ${mvColor(r.movement)}`}>{r.movement ? (r.movement > 0 ? `+${r.movement}` : String(r.movement)) : '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.searchVolume?.toLocaleString() ?? '—'}</td>
                      <td className={`px-4 py-2.5 ${diffColor(r.difficulty)}`}>{r.difficulty ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{new Date(r.trackedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!loading && ranks.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No keywords tracked yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'research' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">AI Keyword Research</h3>
            <form onSubmit={handleResearch} className="space-y-2">
              {[
                { key: 'seedKeyword', label: 'Seed Keyword', placeholder: 'e.g. CRM software' },
                { key: 'industry', label: 'Industry (optional)', placeholder: 'e.g. SaaS' },
                { key: 'country', label: 'Country', placeholder: 'us' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{label}</label>
                  <input
                    className="w-full mt-0.5 border rounded-lg px-3 py-1.5 text-sm"
                    placeholder={placeholder}
                    value={(researchForm as Record<string, string>)[key]}
                    onChange={(e) => setResearchForm((p) => ({ ...p, [key]: e.target.value }))}
                    required={key === 'seedKeyword'}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500">Count</label>
                <input type="number" min="5" max="50" className="w-full mt-0.5 border rounded-lg px-3 py-1.5 text-sm" value={researchForm.count} onChange={(e) => setResearchForm((p) => ({ ...p, count: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-60">
                {loading ? 'Researching...' : 'Generate Keywords'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Keyword Suggestions ({suggestions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Keyword', 'Volume', 'Difficulty', 'Intent', 'URL'].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suggestions.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.keyword}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.searchVolume?.toLocaleString() ?? '—'}</td>
                      <td className={`px-4 py-2.5 font-medium ${diffColor(s.difficulty)}`}>{s.difficulty ?? '—'}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs ${s.intent === 'transactional' ? 'bg-green-100 text-green-700' : s.intent === 'commercial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{s.intent}</span></td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{s.suggestedUrl ?? '—'}</td>
                    </tr>
                  ))}
                  {suggestions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Generate AI keyword suggestions above</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
