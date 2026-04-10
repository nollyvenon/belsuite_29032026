'use client';

import { useCallback, useEffect, useState } from 'react';

export type CreditBillingProvider = 'stripe' | 'paystack' | 'mpesa' | 'crypto' | 'sofort';

export interface ProviderCapability {
  provider: CreditBillingProvider;
  supportsSubscriptions: boolean;
  supportsTopup: boolean;
  supportsWebhook: boolean;
  supportsHostedCheckout: boolean;
  requiresPhoneNumber: boolean;
}

export interface CreditBalance {
  balanceCredits: number;
  account: {
    id: string;
    balanceCredits: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    reservedCredits: number;
    lowBalanceAlert?: number | null;
    autoTopUpAt?: number | null;
  };
}

export interface UsageLog {
  id: string;
  feature: string;
  model?: string | null;
  provider?: string | null;
  creditsCost: number;
  usdEquivalent: number;
  totalTokens?: number | null;
  videoMinutes?: number | null;
  createdAt: string;
}

function authHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/credit-billing${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  const body = await response.json();
  return body.data as T;
}

export function useCreditBilling() {
  const [capabilities, setCapabilities] = useState<ProviderCapability[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providerCapabilities, creditBalance, recentUsageLogs] = await Promise.all([
        apiFetch<ProviderCapability[]>('/provider-capabilities'),
        apiFetch<CreditBalance>('/credits/balance'),
        apiFetch<UsageLog[]>('/usage/logs?limit=20'),
      ]);

      setCapabilities(providerCapabilities);
      setBalance(creditBalance);
      setUsageLogs(recentUsageLogs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const providerCheckout = useCallback(
    async (payload: {
      provider: CreditBillingProvider;
      email: string;
      bundleId?: string;
      priceId?: string;
      amountUsd?: number;
      phoneNumber?: string;
      currency?: string;
      successUrl: string;
      cancelUrl: string;
    }) => {
      const result = await apiFetch<any>('/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return result;
    },
    [],
  );

  return {
    capabilities,
    balance,
    usageLogs,
    loading,
    error,
    reload: load,
    providerCheckout,
  };
}
