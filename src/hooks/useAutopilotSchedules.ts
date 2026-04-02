'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SchedulePreset {
  preset: string;
  label: string;
  cron: string;
  isCustom: boolean;
}

export interface ConfiguredSchedule {
  id: string;
  organizationId: string;
  policyId?: string;
  preset: string;
  cron: string;
  enabled: boolean;
  updatedAt: string;
  liveStatus: 'running' | 'stopped' | 'not_loaded';
  nextRun?: string | null;
  jobName?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/autopilot${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export function useAutopilotSchedules() {
  const [presets, setPresets] = useState<SchedulePreset[]>([]);
  const [schedules, setSchedules] = useState<ConfiguredSchedule[]>([]);
  const [liveJobs, setLiveJobs] = useState<ConfiguredSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [presetsRes, schedulesRes, liveRes] = await Promise.all([
        apiFetch<SchedulePreset[]>('/schedules/presets'),
        apiFetch<ConfiguredSchedule[]>('/schedules'),
        apiFetch<ConfiguredSchedule[]>('/schedules/live'),
      ]);
      setPresets(presetsRes || []);
      setSchedules(schedulesRes || []);
      setLiveJobs(liveRes || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsertSchedule = useCallback(
    async (payload: {
      organizationId: string;
      policyId?: string;
      preset: string;
      customCron?: string;
      enabled: boolean;
    }) => {
      const result = await apiFetch<ConfiguredSchedule>('/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await load();
      return result;
    },
    [load],
  );

  const deleteSchedule = useCallback(
    async (organizationId: string) => {
      await apiFetch(`/schedules/${organizationId}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return {
    presets,
    schedules,
    liveJobs,
    loading,
    error,
    reload: load,
    upsertSchedule,
    deleteSchedule,
  };
}
