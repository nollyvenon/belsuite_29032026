'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type WorkflowType =
  | 'SCHEDULING'
  | 'CONDITIONAL'
  | 'SEQUENCE'
  | 'TRIGGER_BASED'
  | 'WEBHOOK';

export type WorkflowAction = {
  id?: string;
  order: number;
  actionType: string;
  config: Record<string, unknown>;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string | null;
  type: WorkflowType;
  trigger: Record<string, unknown>;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string | null;
  updatedAt: string;
  actions: WorkflowAction[];
};

export type AutomationStats = {
  periodDays: number;
  totals: {
    workflows: number;
    active: number;
    inactive: number;
    totalExecutions: number;
    executedRecently: number;
  };
  topWorkflows: Array<{
    id: string;
    name: string;
    type: WorkflowType;
    isActive: boolean;
    executionCount: number;
    lastExecutedAt?: string | null;
  }>;
  typeBreakdown: Array<{ type: WorkflowType; count: number; executions: number }>;
};

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/automation/workflows`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch workflows (${res.status})`);
      const data = await res.json();
      setWorkflows(data.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/automation/stats?days=30`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`);
      setStats(await res.json());
    } catch {
      setStats(null);
    }
  }, []);

  const createWorkflow = useCallback(
    async (payload: {
      name: string;
      description?: string;
      type: WorkflowType;
      trigger: Record<string, unknown>;
      isActive?: boolean;
      actions: WorkflowAction[];
    }) => {
      const res = await fetch(`${API_BASE}/api/automation/workflows`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create workflow (${res.status})`);
      await Promise.all([loadWorkflows(), loadStats()]);
      return res.json();
    },
    [loadWorkflows, loadStats],
  );

  const runWorkflow = useCallback(
    async (workflowId: string) => {
      const res = await fetch(`${API_BASE}/api/automation/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to execute workflow (${res.status})`);
      const result = await res.json();
      await Promise.all([loadWorkflows(), loadStats()]);
      return result;
    },
    [loadWorkflows, loadStats],
  );

  const setActive = useCallback(
    async (workflowId: string, active: boolean) => {
      const endpoint = active ? 'activate' : 'deactivate';
      const res = await fetch(`${API_BASE}/api/automation/workflows/${workflowId}/${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to update workflow (${res.status})`);
      await Promise.all([loadWorkflows(), loadStats()]);
      return res.json();
    },
    [loadWorkflows, loadStats],
  );

  const deleteWorkflow = useCallback(
    async (workflowId: string) => {
      const res = await fetch(`${API_BASE}/api/automation/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete workflow (${res.status})`);
      }
      await Promise.all([loadWorkflows(), loadStats()]);
    },
    [loadWorkflows, loadStats],
  );

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, [loadWorkflows, loadStats]);

  return {
    workflows,
    stats,
    loading,
    error,
    reload: async () => {
      await Promise.all([loadWorkflows(), loadStats()]);
    },
    createWorkflow,
    runWorkflow,
    setActive,
    deleteWorkflow,
  };
}
