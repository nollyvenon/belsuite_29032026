'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAICalling } from '@/hooks/useAICalling';

export default function AICallingPage() {
  const {
    stats,
    agents,
    calls,
    loading,
    error,
    reload,
    createVoiceAgent,
    startCall,
    sendTurn,
    bookAppointment,
  } = useAICalling();

  const [agentForm, setAgentForm] = useState({
    name: '',
    objective: 'book_appointments',
    industry: '',
    style: 'consultative' as 'consultative' | 'urgent' | 'friendly' | 'enterprise',
  });

  const [callForm, setCallForm] = useState({
    voiceAgentId: '',
    fullName: '',
    companyName: '',
    phone: '',
    objective: 'book a growth strategy call',
  });

  const statusSummary = useMemo(() => {
    if (!stats) return 'No status data yet';
    if (!stats.byProviderStatus.length) return 'No provider callbacks yet';
    return stats.byProviderStatus.map((s) => `${s.status}: ${s.count}`).join(' | ');
  }, [stats]);

  async function onCreateAgent(e: FormEvent) {
    e.preventDefault();
    await createVoiceAgent({
      name: agentForm.name,
      objective: agentForm.objective,
      industry: agentForm.industry || undefined,
      style: agentForm.style,
      objectionPlaybook: [
        'Not interested right now',
        'Send me details by email',
        'We already have a vendor',
      ],
      qualificationQuestions: [
        'What growth target matters most this quarter?',
        'Do you have a dedicated operator for outbound?',
      ],
    });
    setAgentForm((prev) => ({ ...prev, name: '' }));
    await reload();
  }

  async function onStartCall(e: FormEvent) {
    e.preventDefault();
    if (!callForm.voiceAgentId) return;

    await startCall({
      voiceAgentId: callForm.voiceAgentId,
      lead: {
        fullName: callForm.fullName || undefined,
        companyName: callForm.companyName || undefined,
        phone: callForm.phone,
      },
      objective: callForm.objective,
    });

    setCallForm((prev) => ({ ...prev, fullName: '', companyName: '', phone: '' }));
    await reload();
  }

  return (
    <main className="min-h-screen bg-[#0f141d] text-zinc-100 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Module 5 - AI Calling and Voice Agents</h1>
            <p className="text-sm text-zinc-400">
              Cold calls, objection handling, qualification scoring, booking, and call recording intelligence.
            </p>
          </div>
          <button
            onClick={reload}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
          >
            Refresh
          </button>
        </header>

        {loading && <p className="text-zinc-400">Loading AI calling module...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {stats && (
          <section className="grid sm:grid-cols-4 gap-4">
            <StatCard title="Calls" value={String(stats.totals.calls)} />
            <StatCard title="Booked" value={String(stats.totals.booked)} />
            <StatCard title="Booking Rate" value={`${stats.totals.bookingRate}%`} />
            <StatCard title="Transcribed" value={String(stats.totals.transcribed)} />
          </section>
        )}

        <section className="grid lg:grid-cols-2 gap-4">
          <form onSubmit={onCreateAgent} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium">Create Voice Agent</h2>
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Agent name"
              value={agentForm.name}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Objective"
              value={agentForm.objective}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, objective: e.target.value }))}
            />
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Industry"
              value={agentForm.industry}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, industry: e.target.value }))}
            />
            <select
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              value={agentForm.style}
              onChange={(e) =>
                setAgentForm((prev) => ({
                  ...prev,
                  style: e.target.value as 'consultative' | 'urgent' | 'friendly' | 'enterprise',
                }))
              }
            >
              <option value="consultative">Consultative</option>
              <option value="urgent">Urgent</option>
              <option value="friendly">Friendly</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm" type="submit">
              Create Agent
            </button>
          </form>

          <form onSubmit={onStartCall} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium">Start AI Call</h2>
            <select
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              value={callForm.voiceAgentId}
              onChange={(e) => setCallForm((prev) => ({ ...prev, voiceAgentId: e.target.value }))}
              required
            >
              <option value="">Select voice agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Lead full name"
              value={callForm.fullName}
              onChange={(e) => setCallForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Company"
              value={callForm.companyName}
              onChange={(e) => setCallForm((prev) => ({ ...prev, companyName: e.target.value }))}
            />
            <input
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              placeholder="Phone (+123...)"
              value={callForm.phone}
              onChange={(e) => setCallForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
            <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm" type="submit">
              Queue Call
            </button>
          </form>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h2 className="text-lg mb-1">Provider Callback Snapshot</h2>
          <p className="text-sm text-zinc-400">{statusSummary}</p>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <h2 className="text-lg">Recent Calls</h2>
          {!calls.length && <p className="text-sm text-zinc-400">No calls yet.</p>}
          {calls.map((call) => (
            <div key={call.id} className="border border-white/10 rounded p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{call.lead?.fullName || call.lead?.phone || call.id}</span>
                <span className="px-2 py-1 rounded bg-white/10">{call.status}</span>
              </div>
              <p className="text-xs text-zinc-400">{call.lead?.companyName || 'No company'} | {call.objective || 'No objective'}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    await sendTurn(call.id, {
                      transcript: 'We are interested but need to understand pricing first.',
                      intentHint: 'pricing_objection',
                    });
                    await reload();
                  }}
                  className="px-2 py-1 text-xs rounded bg-sky-700 hover:bg-sky-600"
                >
                  Simulate Turn
                </button>
                <button
                  onClick={async () => {
                    const at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
                    await bookAppointment({
                      callId: call.id,
                      appointmentAt: at,
                      timezone: 'UTC',
                      notes: 'Booked from module 5 dashboard',
                    });
                    await reload();
                  }}
                  className="px-2 py-1 text-xs rounded bg-violet-700 hover:bg-violet-600"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
