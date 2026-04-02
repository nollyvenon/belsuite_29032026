'use client';
import { useEffect, useState } from 'react';
import { BoardView, Deal, DealStats, useDeals } from '../../hooks/useDeals';

const STAGES = ['PROSPECTING', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
const STAGE_COLORS: Record<string, string> = {
  PROSPECTING: 'bg-slate-100 border-slate-300',
  QUALIFIED: 'bg-blue-50 border-blue-300',
  PROPOSAL: 'bg-yellow-50 border-yellow-300',
  NEGOTIATION: 'bg-orange-50 border-orange-300',
  CLOSED_WON: 'bg-green-50 border-green-300',
  CLOSED_LOST: 'bg-red-50 border-red-300',
};
const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

function fmt(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function DealsPage() {
  const { loading, error, getBoard, getStats, createDeal, updateDeal, deleteDeal, aiScore } = useDeals();
  const [board, setBoard] = useState<BoardView | null>(null);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', contactEmail: '', contactName: '', companyName: '', value: '', stage: 'PROSPECTING', priority: 'MEDIUM', probability: '20', notes: '' });
  const [scoring, setScoring] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<Record<string, string | number>>({});

  const reload = async () => {
    const [b, s] = await Promise.all([getBoard(), getStats()]);
    setBoard(b);
    setStats(s);
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeal({ title: form.title, contactEmail: form.contactEmail || undefined, contactName: form.contactName || undefined, companyName: form.companyName || undefined, value: Number(form.value), stage: form.stage as Deal['stage'], priority: form.priority as Deal['priority'], probability: Number(form.probability), notes: form.notes || undefined });
    setShowForm(false);
    setForm({ title: '', contactEmail: '', companyName: '', contactName: '', value: '', stage: 'PROSPECTING', priority: 'MEDIUM', probability: '20', notes: '' });
    reload();
  };

  const handleStageChange = async (id: string, stage: string) => {
    await updateDeal(id, { stage: stage as Deal['stage'] });
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete deal?')) return;
    await deleteDeal(id);
    reload();
  };

  const handleAIScore = async (id: string) => {
    setScoring(id);
    const res = await aiScore(id);
    setScoreResult({ [id]: res.score });
    setScoring(null);
    reload();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">HubSpot-style CRM pipeline</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + New Deal
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Pipeline Value', value: fmt(stats.pipelineValue) },
            { label: 'Won Value', value: fmt(stats.wonValue) },
            { label: 'Win Rate', value: `${stats.winRate}%` },
            { label: 'Open Deals', value: String(stats.openDeals) },
            { label: 'Avg Deal', value: fmt(stats.avgDealValue) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Kanban board */}
      {board && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const deals = board.board[stage] ?? [];
            const total = board.totals.find((t) => t.stage === stage);
            return (
              <div key={stage} className={`flex-shrink-0 w-64 rounded-xl border-2 ${STAGE_COLORS[stage]} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-gray-700">{stage.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">{deals.length} · {fmt(total?.value ?? 0)}</span>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {deals.map((d) => (
                    <div key={d.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm text-gray-800 leading-snug">{d.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_BADGE[d.priority] ?? ''}`}>{d.priority}</span>
                      </div>
                      {d.companyName && <p className="text-xs text-gray-500 mt-0.5">{d.companyName}</p>}
                      <p className="text-sm font-semibold text-indigo-600 mt-1">{fmt(d.value)}</p>
                      {(d.aiScore !== null && d.aiScore !== undefined) && (
                        <p className="text-xs text-green-600 mt-0.5">AI Score: {d.aiScore}</p>
                      )}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <select
                          className="text-xs border rounded px-1 py-0.5 text-gray-600"
                          value={d.stage}
                          onChange={(e) => handleStageChange(d.id, e.target.value)}
                        >
                          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => handleAIScore(d.id)} disabled={scoring === d.id} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50">
                          {scoring === d.id ? '...' : 'Score'}
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded hover:bg-red-200">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && <div className="text-center py-12 text-gray-400">Loading...</div>}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Deal</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {(['title', 'contactEmail', 'contactName', 'companyName', 'notes'] as const).map((f) => (
                <div key={f}>
                  <label className="text-xs text-gray-500 capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm"
                    value={form[f]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))}
                    required={f === 'title'}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Value ($)</label>
                  <input type="number" min="0" className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Probability (%)</label>
                  <input type="number" min="0" max="100" className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.probability} onChange={(e) => setForm((p) => ({ ...p, probability: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Stage</label>
                  <select className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Priority</label>
                  <select className="w-full mt-0.5 border rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
