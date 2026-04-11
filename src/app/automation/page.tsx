'use client';

import { useMemo, useState } from 'react';
import { Activity, Play, Power, PowerOff, Plus, Trash2, Workflow } from 'lucide-react';
import { useAutomation, WorkflowAction, WorkflowType } from '@/hooks/useAutomation';

const TYPES: WorkflowType[] = ['SCHEDULING', 'CONDITIONAL', 'SEQUENCE', 'TRIGGER_BASED', 'WEBHOOK'];

const DEFAULT_TRIGGER = '{"event":"content_published"}';
const DEFAULT_ACTIONS = '[{"order":1,"actionType":"email","config":{"template":"publish-notify"}}]';

function prettyDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

export default function AutomationPage() {
  const { workflows, stats, loading, error, createWorkflow, runWorkflow, setActive, deleteWorkflow, reload } = useAutomation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkflowType>('TRIGGER_BASED');
  const [triggerJson, setTriggerJson] = useState(DEFAULT_TRIGGER);
  const [actionsJson, setActionsJson] = useState(DEFAULT_ACTIONS);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCount = useMemo(() => workflows.filter((w) => w.isActive).length, [workflows]);

  const onCreate = async () => {
    setSaving(true);
    setFormError(null);

    try {
      const trigger = JSON.parse(triggerJson);
      const actions = JSON.parse(actionsJson) as WorkflowAction[];

      if (!name.trim()) throw new Error('Name is required');
      if (!Array.isArray(actions) || actions.length === 0) throw new Error('At least one action is required');

      await createWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        trigger,
        actions,
      });

      setName('');
      setDescription('');
      setType('TRIGGER_BASED');
      setTriggerJson(DEFAULT_TRIGGER);
      setActionsJson(DEFAULT_ACTIONS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON payload';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Workflow className="w-6 h-6 text-cyan-400" /> Automation Engine
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Build trigger-based workflows and run them on demand.</p>
          </div>
          <button
            onClick={() => void reload()}
            className="px-3 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-900 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-zinc-400 text-xs">Total Workflows</div>
            <div className="text-2xl font-semibold">{stats?.totals.workflows ?? workflows.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-zinc-400 text-xs">Active</div>
            <div className="text-2xl font-semibold text-emerald-400">{stats?.totals.active ?? activeCount}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-zinc-400 text-xs">Executions</div>
            <div className="text-2xl font-semibold">{stats?.totals.totalExecutions ?? 0}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-zinc-400 text-xs">Executed Recently</div>
            <div className="text-2xl font-semibold text-cyan-400">{stats?.totals.executedRecently ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <h2 className="font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Create Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Workflow name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkflowType)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {TYPES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm min-h-16"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Trigger JSON</label>
              <textarea
                value={triggerJson}
                onChange={(e) => setTriggerJson(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs min-h-24"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Actions JSON (array)</label>
              <textarea
                value={actionsJson}
                onChange={(e) => setActionsJson(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs min-h-24"
              />
            </div>
          </div>
          {formError && <div className="text-sm text-red-400">{formError}</div>}
          <button
            onClick={() => void onCreate()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-sm font-medium"
          >
            {saving ? 'Creating...' : 'Create Workflow'}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-medium mb-4">Workflow List</h2>
          {loading ? (
            <div className="text-zinc-400 text-sm">Loading workflows...</div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : workflows.length === 0 ? (
            <div className="text-zinc-400 text-sm">No workflows yet.</div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
                          {workflow.type}
                        </span>
                        {workflow.isActive ? (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-700 text-emerald-300">Active</span>
                        ) : (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">Inactive</span>
                        )}
                      </div>
                      {workflow.description && <p className="text-sm text-zinc-400 mt-1">{workflow.description}</p>}
                      <div className="text-xs text-zinc-500 mt-2 flex flex-wrap gap-4">
                        <span className="inline-flex items-center gap-1"><Activity className="w-3 h-3" /> Runs: {workflow.executionCount}</span>
                        <span>Actions: {workflow.actions.length}</span>
                        <span>Last Run: {prettyDate(workflow.lastExecutedAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void runWorkflow(workflow.id)}
                        className="px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Execute
                      </button>
                      <button
                        onClick={() => void setActive(workflow.id, !workflow.isActive)}
                        className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 inline-flex items-center gap-1"
                      >
                        {workflow.isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                        {workflow.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => void deleteWorkflow(workflow.id)}
                        className="px-3 py-1.5 text-xs rounded border border-red-800 text-red-300 hover:bg-red-950/30 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
