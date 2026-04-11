'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Plus,
  Globe,
  GlobeLock,
  Trash2,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { useFunnels } from '@/hooks/useMarketing';
import type { Funnel } from '@/hooks/useMarketing';

const FUNNEL_TYPES = ['LEAD_GEN', 'SALES', 'WEBINAR', 'PRODUCT_LAUNCH', 'ECOMMERCE', 'CUSTOM'];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-zinc-700/50 text-zinc-400',
  PUBLISHED: 'bg-emerald-400/10 text-emerald-400',
  ARCHIVED: 'bg-zinc-800/80 text-zinc-600',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function FunnelsView() {
  const {
    funnels,
    loading,
    createFunnel,
    generateFunnel,
    publishFunnel,
    unpublishFunnel,
    deleteFunnel,
  } = useFunnels();

  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [aiForm, setAiForm] = useState({
    businessName: '',
    productOrService: '',
    targetAudience: '',
    funnelType: 'LEAD_GEN',
    objective: 'SALES',
  });
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createFunnel({
        name: createForm.name,
        slug: slugify(createForm.name),
        description: createForm.description || undefined,
      });
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateAI(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      await generateFunnel({
        businessName: aiForm.businessName,
        productOrService: aiForm.productOrService,
        targetAudience: aiForm.targetAudience || '',
        objective: aiForm.objective,
        funnelType: aiForm.funnelType,
      });
      setShowAI(false);
    } finally {
      setGenerating(false);
    }
  }

  async function handleTogglePublish(funnel: Funnel) {
    setPublishingId(funnel.id);
    try {
      if (funnel.status === 'PUBLISHED') {
        await unpublishFunnel(funnel.id);
      } else {
        await publishFunnel(funnel.id);
      }
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this funnel? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteFunnel(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {funnels.length} funnel{funnels.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Funnel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : funnels.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No funnels yet. Create one manually or let AI build it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {funnels.map((funnel, i) => (
            <motion.div
              key={funnel.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3"
            >
              <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{funnel.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[funnel.status] ?? 'bg-zinc-700/50 text-zinc-400'}`}
                  >
                    {funnel.status}
                  </span>
                  {funnel.aiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400 shrink-0">
                      AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                  {funnel._count?.pages != null && (
                    <span>{funnel._count.pages} page{funnel._count.pages !== 1 ? 's' : ''}</span>
                  )}
                  {funnel.slug && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />/{funnel.slug}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(funnel)}
                  disabled={publishingId === funnel.id}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                  title={funnel.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                >
                  {publishingId === funnel.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : funnel.status === 'PUBLISHED' ? (
                    <GlobeLock className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(funnel.id)}
                  disabled={deletingId === funnel.id}
                  className="p-2 rounded-lg hover:bg-red-400/10 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deletingId === funnel.id ? (
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

      {/* Create manual modal */}
      <AnimatePresence>
        {showCreate && (
          <ModalOverlay onClose={() => setShowCreate(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
              <ModalHeader title="New Funnel" onClose={() => setShowCreate(false)} />
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Funnel Name *</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Product Launch Funnel"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description"
                  className={`${inputCls} resize-none`}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create Funnel'}
              </button>
            </form>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* AI modal */}
      <AnimatePresence>
        {showAI && (
          <ModalOverlay onClose={() => setShowAI(false)}>
            <form onSubmit={handleGenerateAI} className="space-y-4">
              <ModalHeader title="AI Funnel Generator" onClose={() => setShowAI(false)} />
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Business Name *</label>
                <input
                  required
                  value={aiForm.businessName}
                  onChange={(e) => setAiForm({ ...aiForm, businessName: e.target.value })}
                  placeholder="Acme Inc."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Product / Service *</label>
                <input
                  required
                  value={aiForm.productOrService}
                  onChange={(e) => setAiForm({ ...aiForm, productOrService: e.target.value })}
                  placeholder="SaaS platform for project management"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Target Audience</label>
                <input
                  value={aiForm.targetAudience}
                  onChange={(e) => setAiForm({ ...aiForm, targetAudience: e.target.value })}
                  placeholder="Small business owners"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Funnel Type</label>
                  <select
                    value={aiForm.funnelType}
                    onChange={(e) => setAiForm({ ...aiForm, funnelType: e.target.value })}
                    className={selectCls}
                  >
                    {FUNNEL_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#111]">{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Objective</label>
                  <select
                    value={aiForm.objective}
                    onChange={(e) => setAiForm({ ...aiForm, objective: e.target.value })}
                    className={selectCls}
                  >
                    {['SALES', 'LEADS', 'AWARENESS', 'CONVERSIONS'].map((o) => (
                      <option key={o} value={o} className="bg-[#111]">{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Funnel</>
                )}
              </button>
            </form>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20';
const selectCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20';

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
