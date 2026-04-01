'use client';

import { useCallback, useEffect, useState } from 'react';

interface VoiceAgent {
  id: string;
  name: string;
  objective?: string;
  industry?: string;
  style?: string;
  objectionPlaybook: string[];
  qualificationQuestions: string[];
  createdAt: string;
}

interface AICall {
  id: string;
  voiceAgentId: string;
  lead?: {
    fullName?: string;
    companyName?: string;
    phone?: string;
  };
  campaignId?: string;
  objective?: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'booked' | string;
  createdAt: string;
}

interface AICallingStats {
  periodDays: number;
  totals: {
    calls: number;
    booked: number;
    bookingRate: number;
    transcribed: number;
  };
  byProviderStatus: Array<{ status: string; count: number }>;
}

interface StartCallPayload {
  voiceAgentId: string;
  lead: {
    fullName?: string;
    companyName?: string;
    phone: string;
    timezone?: string;
    attributes?: Record<string, unknown>;
  };
  campaignId?: string;
  objective?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ai-calling${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }

  return res.json() as Promise<T>;
}

export function useAICalling() {
  const [stats, setStats] = useState<AICallingStats | null>(null);
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [calls, setCalls] = useState<AICall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, agentsRes, callsRes] = await Promise.all([
        apiFetch<AICallingStats>('/stats?days=30'),
        apiFetch<VoiceAgent[]>('/agents'),
        apiFetch<{ items: AICall[] }>('/calls?page=1&limit=20'),
      ]);

      setStats(statsRes);
      setAgents(agentsRes || []);
      setCalls(callsRes.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load AI calling module data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createVoiceAgent = useCallback(
    (payload: {
      name: string;
      objective?: string;
      industry?: string;
      style?: 'consultative' | 'urgent' | 'friendly' | 'enterprise';
      objectionPlaybook?: string[];
      qualificationQuestions?: string[];
      memoryConfig?: Record<string, unknown>;
    }) =>
      apiFetch<VoiceAgent>('/agents', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  const startCall = useCallback(
    (payload: StartCallPayload) =>
      apiFetch<{ callId: string; status: string; openingScript?: string }>('/calls/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  const sendTurn = useCallback(
    (callId: string, payload: { text?: string; transcript?: string; intentHint?: string }) =>
      apiFetch<{ callId: string; agentReply: string; qualification: Record<string, unknown> }>(
        `/calls/${callId}/turn`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    [],
  );

  const bookAppointment = useCallback(
    (payload: { callId: string; appointmentAt: string; timezone?: string; notes?: string }) =>
      apiFetch<{ callId: string; status: string }>('/calls/book-appointment', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  return {
    stats,
    agents,
    calls,
    loading,
    error,
    reload: load,
    createVoiceAgent,
    startCall,
    sendTurn,
    bookAppointment,
  };
}
