'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  Check,
  Coins,
  CreditCard,
  Loader2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { trackAnalyticsEvent } from '@/hooks/useAnalytics';
import { BillingCycle, PaymentProvider, useBilling } from '@/hooks/useBilling';

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  stripe: 'Stripe',
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  paypal: 'PayPal',
  sofort: 'Sofort',
  crypto: 'Crypto',
};

function currency(value: number, code = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BillingPage() {
  const {
    plans,
    coupons,
    overview,
    loading,
    error,
    reload,
    previewQuote,
    applyCoupon,
    clearCoupon,
    checkoutSubscription,
  } = useBilling();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [provider, setProvider] = useState<PaymentProvider>('crypto');
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof previewQuote>> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState({
    billingEmail: '',
    billingName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'US',
    taxId: '',
    paymentMethodId: 'crypto-wallet',
  });

  useEffect(() => {
    if (overview?.subscription?.plan?.id && !selectedPlanId) {
      setSelectedPlanId(overview.subscription.plan.id);
    }
  }, [overview, selectedPlanId]);

  useEffect(() => {
    if (overview?.billingProfile) {
      setBillingForm((current) => ({
        ...current,
        billingEmail: overview.billingProfile?.billingEmail || current.billingEmail,
        billingName: overview.billingProfile?.billingName || current.billingName,
        billingAddress: overview.billingProfile?.billingAddress || current.billingAddress,
        billingCountry: overview.billingProfile?.billingCountry || current.billingCountry,
        taxId: overview.billingProfile?.taxId || current.taxId,
      }));
    }
  }, [overview?.billingProfile]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId],
  );

  const supportedProviders = useMemo(
    () => selectedPlan?.supportedProviders ?? overview?.providers ?? [],
    [overview?.providers, selectedPlan?.supportedProviders],
  );

  useEffect(() => {
    if (supportedProviders.length > 0 && !supportedProviders.includes(provider)) {
      setProvider(supportedProviders[0]);
    }
  }, [provider, supportedProviders]);

  const handlePreview = async () => {
    if (!selectedPlan) return;
    setPreviewing(true);
    setActionError(null);

    try {
      const nextQuote = await previewQuote({
        planId: selectedPlan.id,
        billingCycle,
        couponCode: couponCode || undefined,
      });
      setQuote(nextQuote);
      trackAnalyticsEvent({
        eventType: 'billing_quote_previewed',
        entityType: 'BILLING_PLAN',
        entityId: selectedPlan.id,
        channel: 'PAYMENTS',
        source: 'APP',
        properties: {
          billingCycle,
          provider,
          couponCode: couponCode || undefined,
        },
      });
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setActionError(null);

    try {
      await applyCoupon(couponCode.trim());
      setSuccessMessage(`Coupon ${couponCode.trim().toUpperCase()} applied.`);
      trackAnalyticsEvent({
        eventType: 'billing_coupon_applied',
        entityType: 'BILLING_COUPON',
        entityId: couponCode.trim().toUpperCase(),
        channel: 'PAYMENTS',
        source: 'APP',
      });
      await handlePreview();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const result = await checkoutSubscription({
        provider,
        planId: selectedPlan.id,
        billingCycle,
        couponCode: couponCode || undefined,
        paymentMethodId: provider === 'crypto' ? 'crypto-wallet' : billingForm.paymentMethodId,
        billingEmail: billingForm.billingEmail,
        billingName: billingForm.billingName || undefined,
        billingAddress: billingForm.billingAddress || undefined,
        billingCity: billingForm.billingCity || undefined,
        billingState: billingForm.billingState || undefined,
        billingZip: billingForm.billingZip || undefined,
        billingCountry: billingForm.billingCountry || undefined,
        taxId: billingForm.taxId || undefined,
      });

      trackAnalyticsEvent({
        eventType: provider === 'crypto' ? 'billing_crypto_checkout_started' : 'billing_subscription_checkout_started',
        entityType: 'BILLING_PLAN',
        entityId: selectedPlan.id,
        channel: 'PAYMENTS',
        source: 'APP',
        properties: {
          provider,
          billingCycle,
        },
      });

      if (result.payment?.redirectUrl) {
        window.location.href = result.payment.redirectUrl;
        return;
      }

      setSuccessMessage('Subscription created successfully.');
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_28%),linear-gradient(180deg,_#0b1020_0%,_#090d18_45%,_#05070d_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
              <BadgeDollarSign className="h-3.5 w-3.5" /> Billing Engine
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Plans, usage billing, coupons, invoices, and crypto checkout.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              Manage recurring plans, monitor AI overages, apply discounts, and launch hosted checkout across card, bank, and crypto providers.
            </p>
          </div>

          <button
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {loading && !overview ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : overview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8 space-y-8"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Active Plan',
                  value: overview.subscription.plan?.name || overview.organization.tier,
                  note: overview.subscription.status,
                  icon: ShieldCheck,
                },
                {
                  label: 'Current Usage Bill',
                  value: currency(overview.usage.summary.totalAmount, overview.usage.summary.currency),
                  note: 'Current period overages',
                  icon: Coins,
                },
                {
                  label: 'Included AI Tokens',
                  value: selectedPlan ? selectedPlan.includedAiTokens.toLocaleString() : '0',
                  note: `${overview.usage.usage.aiTokensUsed.toLocaleString()} used`,
                  icon: Sparkles,
                },
                {
                  label: 'Invoices',
                  value: overview.subscription.invoices.length.toString(),
                  note: `Next renewal ${new Date(overview.subscription.currentPeriodEnd).toLocaleDateString()}`,
                  icon: Receipt,
                },
              ].map((card) => (
                <div key={card.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
                      <p className="mt-2 text-sm text-slate-400">{card.note}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <card.icon className="h-5 w-5 text-amber-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Choose a plan</h2>
                    <p className="mt-1 text-sm text-slate-400">Switch billing cycles, compare included usage, and launch checkout.</p>
                  </div>
                  <div className="flex rounded-full border border-white/10 bg-black/20 p-1 text-sm">
                    {(['MONTHLY', 'YEARLY'] as BillingCycle[]).map((cycle) => (
                      <button
                        key={cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={`rounded-full px-4 py-2 transition-colors ${billingCycle === cycle ? 'bg-white text-black' : 'text-slate-300'}`}
                      >
                        {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {plans.map((plan) => {
                    const planPrice = billingCycle === 'YEARLY' ? plan.pricePerYear || plan.pricePerMonth * 10 : plan.pricePerMonth;
                    const isSelected = selectedPlan?.id === plan.id;

                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`rounded-[24px] border p-5 text-left transition-all ${isSelected ? 'border-amber-300/60 bg-amber-300/10 shadow-[0_0_0_1px_rgba(253,186,116,0.25)]' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{plan.tier}</p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h3>
                            <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                          </div>
                          {isSelected ? <Check className="h-5 w-5 text-amber-300" /> : null}
                        </div>

                        <p className="mt-5 text-3xl font-semibold text-white">{currency(planPrice)}</p>
                        <p className="mt-1 text-sm text-slate-400">{billingCycle === 'YEARLY' ? 'per year' : 'per month'}</p>

                        <div className="mt-5 grid gap-2 text-sm text-slate-200">
                          <p>{plan.includedAiTokens.toLocaleString()} AI tokens included</p>
                          <p>{plan.maxProjects} projects</p>
                          <p>{plan.maxStorageGB} GB storage</p>
                          <p>{plan.requestsPerMinute} AI requests per minute</p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {plan.supportedProviders.map((item) => (
                            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                              {PROVIDER_LABELS[item]}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-semibold text-white">Checkout</h2>
                  <p className="mt-1 text-sm text-slate-400">Hosted crypto checkout is instant. Other processors can use an existing saved payment method token.</p>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Provider</span>
                      <select
                        value={provider}
                        onChange={(event) => setProvider(event.target.value as PaymentProvider)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                      >
                        {supportedProviders.map((item) => (
                          <option key={item} value={item} className="bg-slate-950">
                            {PROVIDER_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Coupon</span>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                          placeholder={overview.activeCoupon?.code || 'START20'}
                          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Apply
                        </button>
                      </div>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['Billing email', 'billingEmail'],
                        ['Billing name', 'billingName'],
                        ['Address', 'billingAddress'],
                        ['Country', 'billingCountry'],
                      ].map(([label, field]) => (
                        <label key={field} className="block">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
                          <input
                            value={billingForm[field as keyof typeof billingForm]}
                            onChange={(event) => setBillingForm((current) => ({ ...current, [field]: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                          />
                        </label>
                      ))}
                    </div>

                    {provider !== 'crypto' ? (
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment method token</span>
                        <input
                          value={billingForm.paymentMethodId}
                          onChange={(event) => setBillingForm((current) => ({ ...current, paymentMethodId: event.target.value }))}
                          placeholder="pm_..., paypal_token, auth_code"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                        />
                      </label>
                    ) : (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        Crypto checkout opens a hosted payment page with wallet instructions and on-chain confirmation.
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handlePreview}
                        disabled={!selectedPlan || previewing}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Preview
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={!selectedPlan || submitting || !billingForm.billingEmail}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-amber-200 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Continue
                      </button>
                    </div>
                  </div>

                  {actionError ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <AlertCircle className="h-4 w-4" /> {actionError}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                      <Check className="h-4 w-4" /> {successMessage}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Active discounts</h2>
                      <p className="mt-1 text-sm text-slate-400">Available incentives and your currently attached coupon.</p>
                    </div>
                    {overview.activeCoupon ? (
                      <button onClick={() => void clearCoupon()} className="text-sm text-amber-200 hover:text-white">
                        Clear active coupon
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-5 space-y-3">
                    {coupons.map((coupon) => (
                      <div key={coupon.code} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{coupon.code}</p>
                            <p className="mt-1 text-sm text-slate-400">{coupon.description}</p>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {coupon.type === 'PERCENTAGE' ? `${coupon.amount}% off` : currency(coupon.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white">Usage-based billing</h2>
                <p className="mt-1 text-sm text-slate-400">AI, API, email, and storage overages are priced directly from your current plan.</p>

                <div className="mt-6 space-y-4">
                  {overview.usage.lineItems.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Quantity {item.quantity.toLocaleString()} · Included {item.included.toLocaleString()} · Overage {item.overage.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-white">{currency(item.amount, overview.usage.summary.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-amber-300/10 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">Current overage total</span>
                    <span className="font-semibold text-white">{currency(overview.usage.summary.totalAmount, overview.usage.summary.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Invoices</h2>
                    <p className="mt-1 text-sm text-slate-400">Recent billing documents and payment status.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {overview.subscription.invoices.length} total
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {overview.subscription.invoices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-slate-400">
                      No invoices yet.
                    </div>
                  ) : (
                    overview.subscription.invoices.map((invoice) => (
                      <div key={invoice.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                        <div>
                          <p className="text-sm font-medium text-white">{invoice.id}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Issued {new Date(invoice.issuedAt).toLocaleDateString()} · Due {new Date(invoice.dueAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-slate-300">{currency(invoice.amount, invoice.currency)}</p>
                        <span className={`rounded-full px-3 py-1 text-xs ${invoice.status === 'PAID' ? 'bg-emerald-400/10 text-emerald-200' : invoice.status === 'FAILED' ? 'bg-red-500/10 text-red-200' : 'bg-white/10 text-slate-200'}`}>
                          {invoice.status}
                        </span>
                        <p className="text-xs text-slate-500">{invoice.paidAt ? `Paid ${new Date(invoice.paidAt).toLocaleDateString()}` : 'Awaiting payment'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {quote ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Quote preview</h2>
                    <p className="mt-1 text-sm text-slate-400">Estimated subscription plus usage for the selected configuration.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {billingCycle}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  {[
                    ['Base', quote.summary.baseAmount],
                    ['Usage', quote.summary.usageAmount],
                    ['Discounts', quote.summary.discountAmount],
                    ['Total', quote.summary.totalAmount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{currency(Number(value), quote.summary.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}