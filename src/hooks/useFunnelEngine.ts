'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStep {
  stepId: string;
  stepIndex: number;
  name: string;
  type: 'landing' | 'capture' | 'upsell' | 'downsell' | 'thankyou' | 'webinar' | 'checkout';
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  formId?: string;
}

export interface Funnel {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  targetAudience?: string;
  offerName?: string;
  steps: FunnelStep[];
  stepCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    options?: string[];
  }>;
  submitLabel: string;
  redirectUrl?: string;
  createdAt: string;
}

export interface FunnelStats {
  periodDays: number;
  totals: {
    funnels: number;
    forms: number;
    captures: number;
    stepCompletions: number;
    conversions: number;
    overallConversionRate: number;
  };
  topFunnels: Array<{ funnelId: string; captures: number }>;
  byUtmSource: Array<{ source: string; count: number }>;
}

export interface AIOptimizationResult {
  funnelId: string;
  analysis: {
    overallScore: number;
    topIssues: string[];
    quickWins: string[];
    suggestions: Array<{
      step: string;
      issue: string;
      recommendation: string;
      expectedLift: string;
    }>;
  };
}

export interface AIStructureSuggestion {
  suggestion: {
    rationale: string;
    estimatedCvr: string;
    steps: Array<{
      type: string;
      name: string;
      headline: string;
      ctaText: string;
      keyElement: string;
    }>;
  };
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/funnel-engine${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFunnelEngine() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, funnelsRes, formsRes] = await Promise.all([
        apiFetch<FunnelStats>('/stats?days=30'),
        apiFetch<{ items: Funnel[] }>('/funnels?page=1&limit=20'),
        apiFetch<Form[]>('/forms'),
      ]);
      setStats(statsRes);
      setFunnels(funnelsRes.items || []);
      setForms(formsRes || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load funnel engine data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createFunnel = useCallback(
    (payload: {
      name: string;
      goal?: string;
      description?: string;
      targetAudience?: string;
      offerName?: string;
      steps?: Partial<FunnelStep>[];
    }) =>
      apiFetch<Funnel>('/funnels', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  const createForm = useCallback(
    (payload: {
      name: string;
      description?: string;
      fields: Form['fields'];
      submitLabel?: string;
      redirectUrl?: string;
    }) =>
      apiFetch<Form>('/forms', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  const optimizeConversion = useCallback(
    (funnelId: string, focusArea?: string) =>
      apiFetch<AIOptimizationResult>('/ai/optimize', {
        method: 'POST',
        body: JSON.stringify({ funnelId, focusArea }),
      }),
    [],
  );

  const suggestStructure = useCallback(
    (payload: {
      goal: string;
      product?: string;
      audience?: string;
      pricePoint?: string;
      industry?: string;
      stepCount?: number;
    }) =>
      apiFetch<AIStructureSuggestion>('/ai/suggest-structure', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [],
  );

  return {
    stats,
    funnels,
    forms,
    loading,
    error,
    reload: load,
    createFunnel,
    createForm,
    optimizeConversion,
    suggestStructure,
  };
}
