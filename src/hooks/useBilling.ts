'use client';

import { useCallback, useEffect, useState } from 'react';

export type PaymentProvider = 'stripe' | 'paystack' | 'flutterwave' | 'paypal' | 'sofort' | 'mpesa' | 'crypto';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface BillingPlan {
  id: string;
  name: string;
  tier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  description: string | null;
  pricePerMonth: number;
  pricePerYear: number | null;
  maxMembers: number;
  maxProjects: number;
  maxStorageGB: number;
  features: string[];
  requestsPerMinute: number;
  includedAiTokens: number;
  includedLeads: number;
  includedMessages: number;
  includedCalls: number;
  payAsYouGoEnabled: boolean;
  usagePricing: {
    aiOveragePer1kTokens: number;
    apiOveragePer1kRequests: number;
    emailOveragePer1k: number;
    leadOveragePerLead: number;
    messageOveragePerMessage: number;
    callOveragePerCall: number;
    storageOveragePerGb: number;
  } | null;
  supportedProviders: PaymentProvider[];
}

export interface BillingCoupon {
  code: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  amount: number;
  scope: 'SUBSCRIPTION' | 'USAGE' | 'ALL';
  durationMonths?: number;
}

export interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FAILED';
  issuedAt: string;
  dueAt: string;
  paidAt?: string | null;
}

export interface BillingOverview {
  organization: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    primaryPaymentMethod: string;
    plan?: {
      id: string;
      name: string;
      tier: string;
    } | null;
    invoices: BillingInvoice[];
  };
  billingProfile?: {
    billingEmail: string;
    billingName?: string | null;
    billingAddress?: string | null;
    billingCountry?: string | null;
    taxId?: string | null;
  } | null;
  activeCoupon?: BillingCoupon | null;
  usage: {
    tier: string;
    usage: {
      aiTokensUsed: number;
      apiCallsCount: number;
      emailsSent: number;
      leadsCaptured: number;
      messagesSent: number;
      callsMade: number;
      storageUsedGb: number;
    };
    lineItems: Array<{
      label: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      included: number;
      overage: number;
    }>;
    summary: {
      baseAmount: number;
      usageAmount: number;
      discountAmount: number;
      totalAmount: number;
      currency: string;
    };
  };
  providers: PaymentProvider[];
}

function authHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/billing${path}`, {
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

export function useBilling() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [coupons, setCoupons] = useState<BillingCoupon[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [loadedPlans, loadedCoupons, loadedOverview] = await Promise.all([
        apiFetch<BillingPlan[]>('/plans'),
        apiFetch<BillingCoupon[]>('/coupons'),
        apiFetch<BillingOverview>('/overview'),
      ]);

      setPlans(loadedPlans);
      setCoupons(loadedCoupons);
      setOverview(loadedOverview);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const previewQuote = useCallback(async (payload: {
    tier?: BillingPlan['tier'];
    planId?: string;
    billingCycle?: BillingCycle;
    couponCode?: string;
    estimatedAiTokens?: number;
    estimatedApiCalls?: number;
    estimatedEmails?: number;
    estimatedLeads?: number;
    estimatedMessages?: number;
    estimatedCalls?: number;
    estimatedStorageGb?: number;
    currency?: string;
  }) => {
    return apiFetch<{
      summary: BillingOverview['usage']['summary'];
      discounts: Array<{ code: string; amount: number; scope: string }>;
      usage: BillingOverview['usage'];
    }>('/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }, []);

  const updateBillingProfile = useCallback(async (payload: {
    billingEmail: string;
    billingName?: string;
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
    taxId?: string;
  }) => {
    const result = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await load();
    return result;
  }, [load]);

  const applyCoupon = useCallback(async (code: string) => {
    const result = await apiFetch<BillingCoupon>('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await load();
    return result;
  }, [load]);

  const clearCoupon = useCallback(async () => {
    const result = await apiFetch('/coupons/active', {
      method: 'DELETE',
    });
    await load();
    return result;
  }, [load]);

  const checkoutSubscription = useCallback(async (payload: {
    provider: PaymentProvider;
    tier?: BillingPlan['tier'];
    planId?: string;
    billingCycle: BillingCycle;
    couponCode?: string;
    paymentMethodId: string;
    billingEmail: string;
    billingName?: string;
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
    taxId?: string;
  }) => {
    const result = await apiFetch<{
      payment?: { redirectUrl?: string | null } | null;
      invoice: BillingInvoice;
      remoteSubscription: { externalSubscriptionId: string };
    }>('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await load();
    return result;
  }, [load]);

  return {
    plans,
    coupons,
    overview,
    loading,
    error,
    reload: load,
    previewQuote,
    updateBillingProfile,
    applyCoupon,
    clearCoupon,
    checkoutSubscription,
  };
}