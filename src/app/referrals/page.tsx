'use client';
import { useEffect, useState } from 'react';
import { ReferralLink, ReferralStats, useReferrals } from '../../hooks/useReferrals';

export default function ReferralsPage() {
  const { loading, error, listLinks, getStats, createLink } = useReferrals();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ campaignName: '', rewardType: 'credit', rewardValue: '0', maxUses: '', expiresAt: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const reload = async () => {
    const [l, s] = await Promise.all([listLinks(), getStats()]);
    setLinks(l);
    setStats(s);
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLink({
      campaignName: form.campaignName || undefined,
      rewardType: form.rewardType,
      rewardValue: Number(form.rewardValue),
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
    });
    setShowForm(false);
    setForm({ campaignName: '', rewardType: 'credit', rewardValue: '0', maxUses: '', expiresAt: '' });
    reload();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const barWidth = (val: number, max: number) => max > 0 ? Math.round((val / max) * 100) : 0;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Viral growth — track clicks, signups & conversions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + New Link
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Clicks', value: stats.totalClicks.toLocaleString() },
            { label: 'Signups', value: stats.totalSignups.toLocaleString() },
            { label: 'Converted', value: stats.totalConverted.toLocaleString() },
            { label: 'Signup Rate', value: `${stats.signupRate}%` },
            { label: 'Conv. Rate', value: `${stats.conversionRate}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Top performers */}
      {stats && stats.topLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-sm mb-3">Top Performing Links</h3>
          <div className="space-y-2">
            {stats.topLinks.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3">
                <span className="text-gray-400 font-mono text-xs w-4">{i + 1}</span>
                <span className="font-mono text-sm text-indigo-600 w-24">{l.code}</span>
                <span className="text-sm text-gray-600 flex-1">{l.campaignName ?? '—'}</span>
                <div className="flex items-center gap-2 w-48">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${barWidth(l.converted, stats.topLinks[0].converted)}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-16 text-right">{l.converted} converted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">All Referral Links ({links.length})</h3>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Campaign', 'Reward', 'Clicks', 'Signups', 'Converted', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-indigo-600 font-medium">{l.code}</td>
                  <td className="px-4 py-2.5 text-gray-700">{l.campaignName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{l.rewardType} · {l.rewardValue}</td>
                  <td className="px-4 py-2.5 text-gray-700">{l.totalClicks.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700">{l.totalSignups.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-semibold text-green-700">{l.totalConverted.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {l.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => copyCode(l.code)} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200">
                      {copied === l.code ? 'Copied!' : 'Copy'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && links.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No referral links yet. Create your first!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Referral Link</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Campaign Name (optional)</label>
                <input className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.campaignName} onChange={(e) => setForm((p) => ({ ...p, campaignName: e.target.value }))} placeholder="e.g. Black Friday 2025" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Reward Type</label>
                  <select className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.rewardType} onChange={(e) => setForm((p) => ({ ...p, rewardType: e.target.value }))}>
                    {['credit', 'cash', 'discount', 'custom'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Reward Value</label>
                  <input type="number" min="0" className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.rewardValue} onChange={(e) => setForm((p) => ({ ...p, rewardValue: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Max Uses (optional)</label>
                  <input type="number" min="1" className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Expires At (optional)</label>
                  <input type="date" className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">Create Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
