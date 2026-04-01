'use client';

import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AICeoMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  activeSubscriptions: number;
  churned30Days: number;
  revenueGrowth: number;
  conversionRate: number;
  timestamp: string;
}

export interface AICeoDecision {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  estimatedImpact: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    percentChange: number;
  };
  implementationSteps: string[];
  confidence: number;
  aiModel: string;
  generatedAt: string;
  expiresAt: string;
}

export interface AICeoDashboard {
  currentMetrics: AICeoMetrics;
  activeDecisions: AICeoDecision[];
  recentReports: AICeoReport[];
  healthCheck: {
    status: string;
    aiModelStatus: string;
    dataSourceStatus: string;
    lastAnalysisTime: string;
    nextScheduledAnalysis: string;
    errorCount: number;
    successRate: number;
  };
  trendAnalysis: {
    revenueTrend: Array<{ date: string; value: number }>;
    churnTrend: Array<{ date: string; value: number }>;
    customerGrowthTrend: Array<{ date: string; value: number }>;
  };
}

export interface AICeoReport {
  id: string;
  organizationId: string;
  frequency: string;
  period: { start: string; end: string };
  generatedAt: string;
  decisions: AICeoDecision[];
}

export type DecisionType =
  | 'revenue_optimization'
  | 'pricing_adjustment'
  | 'churn_mitigation'
  | 'feature_recommendation'
  | 'growth_strategy';

function getAuthHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAICeoDashboard(organizationId: string) {
  const [data, setData] = useState<AICeoDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-ceo/dashboard/${organizationId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return { data, loading, error, refetch: fetchDashboard };
}

export function useGenerateDecision() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AICeoDecision | null>(null);

  const generate = useCallback(async (organizationId: string, decisionType: DecisionType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-ceo/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ organizationId, decisionType }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const decision = await res.json();
      setResult(decision);
      return decision as AICeoDecision;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error, result };
}

export function useApplyDecision() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async (organizationId: string, decisionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-ceo/decisions/${decisionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ organizationId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apply, loading, error };
}

export function useDecisionHistory(organizationId: string) {
  const [data, setData] = useState<AICeoDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/ai-ceo/decisions/history/${organizationId}`,
        { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return { data, loading, error, refetch: fetchHistory };
}

export function useGenerateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AICeoReport | null>(null);

  const generate = useCallback(
    async (organizationId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/admin/ai-ceo/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ organizationId, frequency }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const report = await res.json();
        setResult(report);
        return report as AICeoReport;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generate, loading, error, result };
}
