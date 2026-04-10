'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAIGatewayDashboard,
  getAIGatewayUsageLimits,
  getFeatureModelLimits,
  getGatewayModels,
  getTenantFeatureModelLimits,
  getTenantUsageLimits,
  listTenants,
  setFeatureModelLimit,
  setTenantFeatureModelLimit,
  setTenantUsageLimit,
  updateAIGatewayControlProfile,
  updateAIGatewayUsageLimits,
  type AIGatewayDashboard,
  type AIGatewayUsageLimits,
} from '@/lib/api/modules/admin';

export function useAdminControlCenter() {
  const [dashboard, setDashboard] = useState<AIGatewayDashboard | null>(null);
  const [usageLimits, setUsageLimits] = useState<AIGatewayUsageLimits | null>(null);
  const [featureModelLimits, setFeatureModelLimits] = useState<Record<string, string[]>>({});
  const [models, setModels] = useState<Array<{ id: string; displayName: string; modelId: string; isEnabled: boolean }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; tier?: string }>>([]);
  const [tenantUsageLimits, setTenantUsageLimits] = useState<Record<string, { maxTokensPerRequest?: number; maxBatchRequests?: number; maxFailoverModels?: number }>>({});
  const [tenantFeatureModelLimits, setTenantFeatureModelLimits] = useState<Record<string, Record<string, string[]>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, limits, modelLimits, modelList, tenantData, tenantLimits, tenantModelLimits] = await Promise.all([
        getAIGatewayDashboard(),
        getAIGatewayUsageLimits(),
        getFeatureModelLimits(),
        getGatewayModels(),
        listTenants(0, 50),
        getTenantUsageLimits(),
        getTenantFeatureModelLimits(),
      ]);
      setDashboard(dash);
      setUsageLimits(limits);
      setFeatureModelLimits(modelLimits);
      setModels(modelList);
      setTenants(tenantData.tenants);
      setTenantUsageLimits(tenantLimits);
      setTenantFeatureModelLimits(tenantModelLimits);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveControlMode = useCallback(async (mode: 'CHEAP' | 'BALANCED' | 'PREMIUM') => {
    setSaving(true);
    try {
      const next = await updateAIGatewayControlProfile({ mode });
      setDashboard((prev) => (prev ? { ...prev, profile: next } : prev));
    } finally {
      setSaving(false);
    }
  }, []);

  const saveUsageLimits = useCallback(async (payload: Partial<AIGatewayUsageLimits>) => {
    setSaving(true);
    try {
      const next = await updateAIGatewayUsageLimits(payload);
      setUsageLimits(next);
      setDashboard((prev) => (prev ? { ...prev, limits: next } : prev));
    } finally {
      setSaving(false);
    }
  }, []);

  const saveFeatureModelLimit = useCallback(async (feature: string, modelIds: string[]) => {
    setSaving(true);
    try {
      await setFeatureModelLimit(feature, modelIds);
      setFeatureModelLimits((prev) => ({ ...prev, [feature]: modelIds }));
    } finally {
      setSaving(false);
    }
  }, []);

  const saveTenantUsageLimit = useCallback(async (
    organizationId: string,
    payload: { maxTokensPerRequest?: number; maxBatchRequests?: number; maxFailoverModels?: number },
  ) => {
    setSaving(true);
    try {
      await setTenantUsageLimit(organizationId, payload);
      setTenantUsageLimits((prev) => ({ ...prev, [organizationId]: { ...(prev[organizationId] ?? {}), ...payload } }));
    } finally {
      setSaving(false);
    }
  }, []);

  const saveTenantFeatureModelLimit = useCallback(async (
    organizationId: string,
    feature: string,
    modelIds: string[],
  ) => {
    setSaving(true);
    try {
      await setTenantFeatureModelLimit(organizationId, feature, modelIds);
      setTenantFeatureModelLimits((prev) => ({
        ...prev,
        [organizationId]: {
          ...(prev[organizationId] ?? {}),
          [feature]: modelIds,
        },
      }));
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    dashboard,
    usageLimits,
    featureModelLimits,
    models,
    tenants,
    tenantUsageLimits,
    tenantFeatureModelLimits,
    loading,
    saving,
    error,
    reload: load,
    saveControlMode,
    saveUsageLimits,
    saveFeatureModelLimit,
    saveTenantUsageLimit,
    saveTenantFeatureModelLimit,
  };
}
