'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEmailHealth,
  getEmailProviders,
  getEmailSettings,
  getSmsHealth,
  getSmsProviders,
  getSmsSettings,
  listTenants,
  updateEmailSettings,
  updateSmsSettings,
  updateTenant,
  type AdminEmailSettings,
  type AdminSmsSettings,
  type EmailProviderConfig,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantData, emailSettings, emailProviders, emailHealth, smsCfg, smsProviderCatalog, smsHealthPayload] = await Promise.all([
        listTenants(),
        getEmailSettings(),
        getEmailProviders(),
        getEmailHealth(),
        getSmsSettings(),
        getSmsProviders(),
        getSmsHealth(),
      ]);

      setTenants(tenantData.tenants);
      setSettings(emailSettings);
      setProviders(emailProviders);
      setHealth(emailHealth);
      setSmsSettings(smsCfg);
      setSmsProviders(smsProviderCatalog);
      setSmsHealth(smsHealthPayload);
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

  return {
    tenants,
    settings,
    providers,
    smsSettings,
    smsProviders,
    health,
    smsHealth,
    loading,
    saving,
    error,
    reload: load,
    saveSettings,
    saveSmsSettings,
    saveTenant,
  };
}