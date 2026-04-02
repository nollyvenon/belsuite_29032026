'use client';

import { FormEvent, useState } from 'react';
import { ConfiguredSchedule, SchedulePreset } from '@/hooks/useAutopilotSchedules';

const STATUS_COLOR: Record<string, string> = {
  running: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  stopped: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  not_loaded: 'text-slate-500 bg-white/5 border-white/10',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? STATUS_COLOR['not_loaded']}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

interface Props {
  presets: SchedulePreset[];
  schedules: ConfiguredSchedule[];
  liveJobs: ConfiguredSchedule[];
  saving: boolean;
  onUpsert: (payload: {
    organizationId: string;
    policyId?: string;
    preset: string;
    customCron?: string;
    enabled: boolean;
  }) => Promise<unknown>;
  onDelete: (organizationId: string) => Promise<void>;
}

export function AutopilotSchedulePanel({ presets, schedules, liveJobs, saving, onUpsert, onDelete }: Props) {
  const [form, setForm] = useState({
    organizationId: '',
    policyId: '',
    preset: 'daily_8am',
    customCron: '',
    enabled: true,
  });

  const [deleteTarget, setDeleteTarget] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await onUpsert({
      organizationId: form.organizationId,
      policyId: form.policyId || undefined,
      preset: form.preset,
      customCron: form.customCron || undefined,
      enabled: form.enabled,
    });
    setForm((p) => ({ ...p, organizationId: '', policyId: '', customCron: '' }));
  }

  const selectedPreset = presets.find((p) => p.preset === form.preset);

  return (
    <div className="space-y-6">
      {/* Create / update form */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Create / Update Autopilot Schedule</h3>
          {selectedPreset && !selectedPreset.isCustom && (
            <span className="rounded-xl border border-white/10 bg-black/20 px-3 py-1 font-mono text-xs text-slate-400">
              {selectedPreset.cron}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            placeholder="Organization ID *"
            value={form.organizationId}
            onChange={(e) => setForm((p) => ({ ...p, organizationId: e.target.value }))}
            required
          />
          <input
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            placeholder="Policy ID (optional — uses latest if blank)"
            value={form.policyId}
            onChange={(e) => setForm((p) => ({ ...p, policyId: e.target.value }))}
          />
        </div>

        <select
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
          value={form.preset}
          onChange={(e) => setForm((p) => ({ ...p, preset: e.target.value }))}
        >
          {presets.map((p) => (
            <option key={p.preset} value={p.preset}>
              {p.label} {!p.isCustom ? `— ${p.cron}` : ''}
            </option>
          ))}
        </select>

        {selectedPreset?.isCustom && (
          <input
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500"
            placeholder="Custom cron expression, e.g. 0 */4 * * *"
            value={form.customCron}
            onChange={(e) => setForm((p) => ({ ...p, customCron: e.target.value }))}
            required
          />
        )}

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
          />
          Enable schedule immediately
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </form>

      {/* Live jobs */}
      {liveJobs.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Live Cron Jobs</h4>
          <div className="space-y-1.5">
            {liveJobs.map((job) => (
              <div
                key={job.organizationId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm"
              >
                <code className="text-slate-200">{job.jobName ?? `org:${job.organizationId}`}</code>
                <span className="font-mono text-xs text-slate-400">{job.cron}</span>
                <StatusBadge status={job.liveStatus ?? (job.enabled ? 'running' : 'stopped')} />
                {job.nextRun && (
                  <span className="text-xs text-slate-500">next {new Date(job.nextRun).toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configured schedules table */}
      {schedules.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Configured Schedules</h4>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-black/20">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Organization</th>
                  <th className="px-4 py-2.5 font-medium">Preset</th>
                  <th className="px-4 py-2.5 font-medium">Cron</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Next Run</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-white/5 text-slate-300">
                    <td className="px-4 py-2.5">
                      <code className="text-xs text-slate-200">{s.organizationId}</code>
                    </td>
                    <td className="px-4 py-2.5">{s.preset.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{s.cron}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={s.liveStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {s.nextRun ? new Date(s.nextRun).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              organizationId: s.organizationId,
                              policyId: s.policyId ?? '',
                              preset: s.preset,
                              enabled: s.enabled,
                            }))
                          }
                          className="rounded-lg px-2.5 py-1 text-xs text-sky-300 border border-sky-500/20 hover:bg-sky-500/10"
                        >
                          Edit
                        </button>
                        <button
                          disabled={deleteTarget === s.organizationId}
                          onClick={async () => {
                            setDeleteTarget(s.organizationId);
                            await onDelete(s.organizationId);
                            setDeleteTarget('');
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs text-rose-300 border border-rose-500/20 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleteTarget === s.organizationId ? 'Deleting…' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {schedules.length === 0 && liveJobs.length === 0 && (
        <p className="text-sm text-slate-500">No schedules configured yet. Create the first one above.</p>
      )}
    </div>
  );
}
