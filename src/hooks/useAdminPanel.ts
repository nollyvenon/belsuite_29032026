'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEmailHealth,
  getEmailProviders,
  getEmailSettings,
  getIntegrationEvents,
  getIntegrations,
  getIntegrationRetryPolicy,
  listIntegrationWebhooks,
  getSmsHealth,
  getSmsProviders,
  getSmsSettings,
  getCampaignChannelRoutes,
  listTenants,
  deleteCampaignChannelRoute,
  upsertCampaignChannelRoute,
  sendSlackMessage,
  upsertIntegrationWebhook,
  updateIntegrationRetryPolicy,
  triggerIntegrationEvent,
  triggerZapierHook,
  updateEmailSettings,
  updateSmsSettings,
  updateTenant,
  type CampaignChannelRoute,
  type AdminEmailSettings,
  type AdminSmsSettings,
  type EmailProviderConfig,
  type IntegrationConnection,
  type IntegrationEventLog,
  type IntegrationWebhookConfig,
  type IntegrationRetryPolicy,
  type SmsProviderConfig,
  type TenantSummary,
} from '@/lib/api/modules/admin';

export function useAdminPanel() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [settings, setSettings] = useState<AdminEmailSettings | null>(null);
  const [providers, setProviders] = useState<EmailProviderConfig[]>([]);
  const [smsSettings, setSmsSettings] = useState<AdminSmsSettings | null>(null);
  const [smsProviders, setSmsProviders] = useState<SmsProviderConfig[]>([]);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [smsHealth, setSmsHealth] = useState<Record<string, unknown> | null>(null);
  const [campaignChannelRoutes, setCampaignChannelRoutes] = useState<CampaignChannelRoute[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [integrationEvents, setIntegrationEvents] = useState<IntegrationEventLog[]>([]);
  const [webhooks, setWebhooks] = useState<IntegrationWebhookConfig[]>([]);
  const [retryPolicy, setRetryPolicy] = useState<IntegrationRetryPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantData, emailSettings, emailProviders, emailHealth, smsCfg, smsProviderCatalog, smsHealthPayload, channelRoutes, integrationPayload, integrationEventPayload, webhookPayload, retryPolicyPayload] = await Promise.all([
        listTenants(),
        getEmailSettings(),
        getEmailProviders(),
        getEmailHealth(),
        getSmsSettings(),
        getSmsProviders(),
        getSmsHealth(),
        getCampaignChannelRoutes(),
        getIntegrations(),
        getIntegrationEvents(),
        listIntegrationWebhooks(),
        getIntegrationRetryPolicy(),
      ]);

      setTenants(tenantData.tenants);
      setSettings(emailSettings);
      setProviders(emailProviders);
      setHealth(emailHealth);
      setSmsSettings(smsCfg);
      setSmsProviders(smsProviderCatalog);
      setSmsHealth(smsHealthPayload);
      setCampaignChannelRoutes(channelRoutes);
      setIntegrations(integrationPayload.data);
      setIntegrationEvents(integrationEventPayload.data);
      setWebhooks(webhookPayload.data);
      setRetryPolicy(retryPolicyPayload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = useCallback(async (payload: Partial<AdminEmailSettings>) => {
    setSaving(true);
    try {
      const next = await updateEmailSettings(payload);
      setSettings(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveTenant = useCallback(async (tenantId: string, payload: { name?: string; tier?: string }) => {
    setSaving(true);
    try {
      const nextTenant = await updateTenant(tenantId, payload);
      setTenants((current) => current.map((tenant) => (tenant.id === tenantId ? { ...tenant, ...nextTenant } : tenant)));
      return nextTenant;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveSmsSettings = useCallback(async (payload: Partial<AdminSmsSettings>) => {
    setSaving(true);
    try {
      const next = await updateSmsSettings(payload);
      setSmsSettings(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveCampaignChannelRoute = useCallback(async (payload: CampaignChannelRoute) => {
    setSaving(true);
    try {
      const next = await upsertCampaignChannelRoute(payload);
      setCampaignChannelRoutes((current) => {
        const idx = current.findIndex((r) => r.objective === next.objective);
        if (idx < 0) return [...current, next];
        const copy = [...current];
        copy[idx] = next;
        return copy;
      });
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeCampaignChannelRoute = useCallback(async (objective: CampaignChannelRoute['objective']) => {
    setSaving(true);
    try {
      await deleteCampaignChannelRoute(objective);
      setCampaignChannelRoutes((current) => current.filter((r) => r.objective !== objective));
    } finally {
      setSaving(false);
    }
  }, []);

  const sendSlackAlert = useCallback(async (payload: { channel: string; text: string; blocks?: unknown[] }) => {
    setSaving(true);
    try {
      return await sendSlackMessage(payload);
    } finally {
      setSaving(false);
    }
  }, []);

  const triggerZapier = useCallback(async (payload: { hookName: string; payload: Record<string, unknown> }) => {
    setSaving(true);
    try {
      return await triggerZapierHook(payload);
    } finally {
      setSaving(false);
    }
  }, []);

  const saveWebhookConfig = useCallback(async (payload: IntegrationWebhookConfig) => {
    setSaving(true);
    try {
      const next = await upsertIntegrationWebhook(payload);
      setWebhooks((current) => {
        const idx = current.findIndex((item) => item.provider === next.provider);
        if (idx < 0) return [...current, next];
        const copy = [...current];
        copy[idx] = next;
        return copy;
      });
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveRetryPolicy = useCallback(async (payload: IntegrationRetryPolicy) => {
    setSaving(true);
    try {
      const next = await updateIntegrationRetryPolicy(payload);
      setRetryPolicy(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  const fireIntegrationEvent = useCallback(async (payload: { eventType: string; payload: Record<string, unknown>; channels: Array<{ provider: string; connectionId?: string | null; channel?: string | null }> }) => {
    setSaving(true);
    try {
      return await triggerIntegrationEvent(payload);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    tenants,
    settings,
    providers,
    smsSettings,
    smsProviders,
    campaignChannelRoutes,
    integrations,
    integrationEvents,
    webhooks,
    retryPolicy,
    health,
    smsHealth,
    loading,
    saving,
    error,
    reload: load,
    saveSettings,
    saveSmsSettings,
    saveCampaignChannelRoute,
    removeCampaignChannelRoute,
    sendSlackAlert,
    triggerZapier,
    saveWebhookConfig,
    saveRetryPolicy,
    fireIntegrationEvent,
    saveTenant,
  };
}