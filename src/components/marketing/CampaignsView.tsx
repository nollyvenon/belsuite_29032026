'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  DollarSign,
  Target,
  Calendar,
  Loader2,
  X,
  Copy,
} from 'lucide-react';
import { useCampaigns, cloneCampaign } from '@/hooks/useMarketing';
import type { Campaign } from '@/hooks/useMarketing';

const OBJECTIVES = [
  'AWARENESS',
  'TRAFFIC',
  'LEADS',
  'SALES',
  'ENGAGEMENT',
  'APP_INSTALLS',
  'VIDEO_VIEWS',
  'CONVERSIONS',
] as const;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-400/10 text-emerald-400',
  PAUSED: 'bg-amber-400/10 text-amber-400',
  DRAFT: 'bg-zinc-700/50 text-zinc-400',
  COMPLETED: 'bg-blue-400/10 text-blue-400',
  CANCELLED: 'bg-red-400/10 text-red-400',
};

export function CampaignsView() {
  const { campaigns, loading, createCampaign, setStatus, deleteCampaign, reload } = useCampaigns();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    objective: 'CONVERSIONS' as string,
    totalBudget: '',
    dailyBudget: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createCampaign({
        name: form.name,
        objective: form.objective as any,
        totalBudget: form.totalBudget ? parseFloat(form.totalBudget) : undefined,
        dailyBudget: form.dailyBudget ? parseFloat(form.dailyBudget) : undefined,
        description: form.description || undefined,
      });
      setShowCreate(false);
      setForm({ name: '', objective: 'CONVERSIONS', totalBudget: '', dailyBudget: '', description: '' });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(campaign: Campaign) {
    setStatusLoadingId(campaign.id);
    try {
      const nextStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await setStatus(campaign.id, nextStatus);
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleClone(id: string) {
    setCloningId(id);
    try {
      await cloneCampaign(id, { name: `${campaigns.find((c) => c.id === id)?.name ?? 'Campaign'} Copy` });
      await reload();
    } catch {
      // ignore
    } finally {
      setCloningId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteCampaign(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
          <Target className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No campaigns yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-4"
            >
              {/* Status indicator */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      STATUS_STYLES[c.status] ?? 'bg-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {c.objective.replace(/_/g, ' ')}
                  </span>
                  {c.totalBudget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(c.totalBudget)}
                    </span>
                  )}
                  {c.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.startDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Budget bar */}
                {c.totalBudget && c.spentBudget != null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-600 mb-1">
                      <span>
                        ${c.spentBudget.toFixed(0)} spent
                      </span>
                      <span>{Math.round((c.spentBudget / c.totalBudget) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(100, (c.spentBudget / c.totalBudget) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ads count */}
              {c._count?.ads != null && (
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold text-white">{c._count.ads}</p>
                  <p className="text-xs text-zinc-500">ads</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleClone(c.id)}
                  disabled={cloningId === c.id}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Clone campaign"
                >
                  {cloningId === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleToggleStatus(c)}
                  disabled={statusLoadingId === c.id}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                  title={c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                >
                  {statusLoadingId === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : c.status === 'ACTIVE' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="p-2 rounded-lg hover:bg-red-400/10 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreate}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">New Campaign</h3>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Campaign Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer Sale 2025"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Objective</label>
                <select
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  {OBJECTIVES.map((o) => (
                    <option key={o} value={o} className="bg-[#111]">
                      {o.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Total Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                    placeholder="5000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Daily Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.dailyBudget}
                    onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                    placeholder="200"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create Campaign'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
