'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, X, Zap,
} from 'lucide-react';
import type { SocialAccount, BulkCreateInput, CreatePostInput, SocialPlatform } from '@/hooks/useSocial';
import { useBulk } from '@/hooks/useSocial';
import { PLATFORM_ICONS } from './PlatformBadge';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-zinc-400 bg-zinc-400/10',
  PROCESSING: 'text-amber-400 bg-amber-400/10',
  COMPLETED:  'text-emerald-400 bg-emerald-400/10',
  PARTIAL:    'text-orange-400 bg-orange-400/10',
  FAILED:     'text-red-400 bg-red-400/10',
};

interface DraftPost {
  content: string;
  accountIds: string[];
  scheduledAt: string;
  hashtags: string;
}

const EMPTY_DRAFT: DraftPost = { content: '', accountIds: [], scheduledAt: '', hashtags: '' };

function BulkCreateModal({
  accounts,
  onClose,
  onCreate,
  creating,
}: {
  accounts: SocialAccount[];
  onClose: () => void;
  onCreate: (input: BulkCreateInput) => Promise<void>;
  creating: boolean;
}) {
  const [name, setName]     = useState('');
  const [posts, setPosts]   = useState<DraftPost[]>([{ ...EMPTY_DRAFT }]);
  const [error, setError]   = useState('');

  const addRow = () => setPosts((p) => [...p, { ...EMPTY_DRAFT }]);
  const removeRow = (i: number) => setPosts((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<DraftPost>) =>
    setPosts((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const toggleAccount = (i: number, accId: string) => {
    updateRow(i, {
      accountIds: posts[i].accountIds.includes(accId)
        ? posts[i].accountIds.filter((id) => id !== accId)
        : [...posts[i].accountIds, accId],
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Batch name is required'); return; }
    const invalid = posts.findIndex((p) => !p.content.trim() || p.accountIds.length === 0);
    if (invalid !== -1) { setError(`Post ${invalid + 1}: content and at least one account required`); return; }

    const input: BulkCreateInput = {
      name: name.trim(),
      posts: posts.map((p) => ({
        content: p.content.trim(),
        accountIds: p.accountIds,
        hashtags: p.hashtags.split(/\s+/).filter(Boolean).map((h) => h.replace(/^#/, '')),
        scheduledAt: p.scheduledAt || undefined,
      } as CreatePostInput)),
    };

    await onCreate(input);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        className="w-full max-w-3xl glass rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Bulk Create Posts</h2>
            <p className="text-xs text-zinc-400">Create up to 100 posts at once</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Batch Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. March Campaign"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Post rows */}
          <div className="space-y-3">
            {posts.map((post, i) => (
              <div key={i} className="glass rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Post {i + 1}</span>
                  {posts.length > 1 && (
                    <button onClick={() => removeRow(i)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  value={post.content}
                  onChange={(e) => updateRow(i, { content: e.target.value })}
                  rows={3}
                  placeholder="Post content…"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                />

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Account buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {accounts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => toggleAccount(i, a.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
                          post.accountIds.includes(a.id)
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>{PLATFORM_ICONS[a.platform]}</span>
                        {a.displayName?.slice(0, 10)}
                      </button>
                    ))}
                  </div>

                  <input
                    type="datetime-local"
                    value={post.scheduledAt}
                    onChange={(e) => updateRow(i, { scheduledAt: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Post
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-white/5 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            disabled={creating || !name.trim()}
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Create {posts.length} Post{posts.length !== 1 ? 's' : ''}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BulkView({ accounts }: { accounts: SocialAccount[] }) {
  const { batches, loading, error, refresh, createBulk } = useBulk();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreate = async (input: BulkCreateInput) => {
    setCreating(true);
    setCreateError('');
    try {
      await createBulk(input);
      setShowCreate(false);
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Bulk Batches</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Create and track bulk post campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Batch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : error ? (
        <p className="text-zinc-400 text-sm">{error}</p>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 h-40 justify-center text-center">
          <Zap className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-400 text-sm">No bulk batches yet</p>
          <button onClick={() => setShowCreate(true)} className="text-sm text-primary hover:underline">Create your first batch</button>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl border border-white/5 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{batch.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[batch.status] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
                  {batch.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total',     value: batch.totalPosts,     color: 'text-white' },
                  { label: 'Scheduled', value: batch.scheduledPosts, color: 'text-amber-400' },
                  { label: 'Published', value: batch.publishedPosts, color: 'text-emerald-400' },
                  { label: 'Failed',    value: batch.failedPosts,    color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/3 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <BulkCreateModal
            accounts={accounts}
            onClose={() => { setShowCreate(false); setCreateError(''); }}
            onCreate={handleCreate}
            creating={creating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
