'use client';
import { useEffect, useState } from 'react';
import { CallCenterStats, InboundCall, useCallCenter } from '../../hooks/useCallCenter';

const STATUS_COLORS: Record<string, string> = {
  RINGING: 'bg-yellow-100 text-yellow-800',
  ANSWERED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  MISSED: 'bg-red-100 text-red-800',
  VOICEMAIL: 'bg-purple-100 text-purple-800',
  TRANSFERRED: 'bg-indigo-100 text-indigo-800',
};
const SENTIMENT_ICON: Record<string, string> = { positive: '😊', neutral: '😐', negative: '😞' };

function fmtDuration(s: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function CallCenterPage() {
  const { loading, error, listCalls, getLiveQueue, getStats, summarize } = useCallCenter();
  const [calls, setCalls] = useState<InboundCall[]>([]);
  const [stats, setStats] = useState<CallCenterStats | null>(null);
  const [queue, setQueue] = useState<{ queueSize: number; calls: InboundCall[]; longestWaitSeconds: number } | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const reload = async () => {
    const [c, s, q] = await Promise.all([listCalls(), getStats(), getLiveQueue()]);
    setCalls(c.items);
    setStats(s);
    setQueue(q);
  };

  useEffect(() => { reload(); }, []);

  const handleSummarize = async (id: string) => {
    setSummarizing(id);
    try {
      const res = await summarize(id);
      setSummaries((p) => ({ ...p, [id]: `${res.summary} [${res.sentiment}] → ${res.followUpAction}` }));
    } finally {
      setSummarizing(null);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Call Center</h1>
        <p className="text-sm text-gray-500 mt-0.5">Inbound call management & AI transcription</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Calls (30d)', value: String(stats.totalCalls) },
            { label: 'Answered', value: String(stats.answeredCalls) },
            { label: 'Missed', value: String(stats.missedCalls) },
            { label: 'Answer Rate', value: `${stats.answerRate}%` },
            { label: 'Avg Duration', value: fmtDuration(stats.avgDurationSeconds) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Live Queue */}
      {queue && queue.queueSize > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-yellow-800">Live Queue — {queue.queueSize} waiting (longest: {fmtDuration(queue.longestWaitSeconds)})</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {queue.calls.map((c) => (
              <div key={c.id} className="bg-white rounded-lg px-3 py-2 border border-yellow-200 text-sm">
                <p className="font-medium text-gray-800">{c.callerName ?? c.fromNumber}</p>
                <p className="text-xs text-gray-500">{c.fromNumber}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calls table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Recent Calls ({calls.length})</h3>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Caller', 'Number', 'Status', 'Agent', 'Duration', 'Sentiment', 'Time', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {calls.map((c) => (
                <>
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{c.callerName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{c.fromNumber}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>{c.status}</span></td>
                    <td className="px-4 py-2.5 text-gray-500">{c.agentId ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmtDuration(c.durationSeconds)}</td>
                    <td className="px-4 py-2.5">{c.sentiment ? SENTIMENT_ICON[c.sentiment] ?? c.sentiment : '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => handleSummarize(c.id)} disabled={summarizing === c.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 disabled:opacity-50">
                        {summarizing === c.id ? '...' : 'AI Summary'}
                      </button>
                    </td>
                  </tr>
                  {summaries[c.id] && (
                    <tr key={`${c.id}-summary`} className="bg-purple-50">
                      <td colSpan={8} className="px-4 py-2 text-xs text-purple-800 italic">{summaries[c.id]}</td>
                    </tr>
                  )}
                </>
              ))}
              {!loading && calls.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No calls logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Stats */}
      {stats && stats.agentStats.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3">Agent Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.agentStats.map((a) => (
              <div key={a.agentId} className="border rounded-lg p-3">
                <p className="font-mono text-xs text-gray-500">{a.agentId}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{a.count} calls</p>
                <p className="text-xs text-green-600">{a.answered} answered</p>
                <p className="text-xs text-gray-500">{fmtDuration(Math.round(a.totalDuration / Math.max(a.answered, 1)))} avg</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
