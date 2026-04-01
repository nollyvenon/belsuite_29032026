'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { type TenantSummary } from '@/lib/api/modules/admin';
import { StatusBadge } from '@/components/system/StatusBadge';

const TIERS = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

export function TenantManagementPanel({
  tenants,
  saving,
  onSave,
}: {
  tenants: TenantSummary[];
  saving: boolean;
  onSave: (tenantId: string, payload: { name?: string; tier?: string }) => Promise<unknown>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { name: string; tier: string }>>({});

  const getDraft = (tenant: TenantSummary) => drafts[tenant.id] ?? { name: tenant.name, tier: tenant.tier ?? 'STARTER' };

  return (
    <div className="space-y-3">
      {tenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-sm text-slate-500">No tenants found.</div>
      ) : (
        tenants.map((tenant) => {
          const draft = getDraft(tenant);
          return (
            <div key={tenant.id} className="grid gap-4 rounded-[24px] border border-white/5 bg-black/20 p-4 lg:grid-cols-[1.4fr_0.8fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-semibold text-white">{tenant.name}</p>
                  <StatusBadge tone={tenant.isActive === false ? 'setup' : 'live'}>{tenant.isActive === false ? 'inactive' : 'active'}</StatusBadge>
                  <StatusBadge tone="neutral">{tenant.tenantOnboarding?.step ?? 'WELCOME'}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{tenant.slug} {tenant.email ? `· ${tenant.email}` : ''}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={draft.name}
                  onChange={(event) => setDrafts((current) => ({ ...current, [tenant.id]: { ...draft, name: event.target.value } }))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                />
                <select
                  value={draft.tier}
                  onChange={(event) => setDrafts((current) => ({ ...current, [tenant.id]: { ...draft, tier: event.target.value } }))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier} className="bg-slate-950">{tier}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => void onSave(tenant.id, { name: draft.name, tier: draft.tier })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}