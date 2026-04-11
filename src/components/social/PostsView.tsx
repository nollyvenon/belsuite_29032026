'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, MoreVertical, Trash2, Clock, RefreshCw,
  Loader2, AlertCircle, ExternalLink, RotateCcw,
} from 'lucide-react';
import type { SocialAccount, ScheduledPost, PostStatus, SocialPlatform } from '@/hooks/useSocial';
import { useSocialPosts } from '@/hooks/useSocial';
import { PostStatusBadge } from './PostStatusBadge';
import { PLATFORM_ICONS } from './PlatformBadge';
import { CreatePostModal } from './CreatePostModal';

const STATUS_OPTIONS: PostStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED'];
const PLATFORM_OPTIONS: SocialPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'PINTEREST', 'WHATSAPP'];

function PostCard({
  post,
  onCancel,
  onReschedule,
}: {
  post: ScheduledPost;
  onCancel: () => Promise<void>;
  onReschedule: (scheduledAt: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [busy, setBusy] = useState(false);

  const platforms = post.accounts.map((a) => a.account.platform);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="glass rounded-2xl border border-white/5 hover:border-white/10 p-5 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Platform icons */}
        <div className="flex flex-col gap-1 shrink-0 mt-0.5">
          {platforms.slice(0, 3).map((p, i) => (
            <span key={i} className="text-base leading-none">{PLATFORM_ICONS[p]}</span>
          ))}
          {platforms.length > 3 && (
            <span className="text-[10px] text-zinc-500">+{platforms.length - 3}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Content preview */}
          <p className="text-sm text-zinc-200 line-clamp-2 leading-relaxed">
            {post.content}
          </p>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <p className="text-xs text-primary/70 mt-1 truncate">
              {post.hashtags.slice(0, 5).map((h) => `#${h}`).join(' ')}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <PostStatusBadge status={post.status} />

            {post.scheduledAt && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(post.scheduledAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </span>
            )}

            {post.aiGenerated && (
              <span className="text-[10px] text-primary/70 border border-primary/20 px-1.5 py-0.5 rounded-full">AI</span>
            )}

            {post.autoRepostEnabled && (
              <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                <RotateCcw className="w-2.5 h-2.5" /> {post.repostCount}/{post.maxReposts}
              </span>
            )}
          </div>

          {/* Publish results */}
          {post.publishResults.length > 0 && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {post.publishResults.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                    r.status === 'SUCCESS'
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                      : r.status === 'FAILED'
                      ? 'border-red-500/20 bg-red-500/5 text-red-400'
                      : 'border-zinc-700 text-zinc-500'
                  }`}
                >
                  <span>{PLATFORM_ICONS[r.platform]}</span>
                  {r.status === 'SUCCESS' ? (
                    r.platformUrl ? (
                      <a href={r.platformUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : 'Published'
                  ) : r.status === 'FAILED' ? (
                    <span title={r.errorMessage ?? ''}>Failed</span>
                  ) : r.status}
                </div>
              ))}
            </div>
          )}

          {/* Reschedule inline form */}
          {rescheduling && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40 transition-colors"
              />
              <button
                disabled={!newDate || busy}
                onClick={async () => {
                  setBusy(true);
                  try { await onReschedule(new Date(newDate).toISOString()); setRescheduling(false); }
                  finally { setBusy(false); }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
              </button>
              <button onClick={() => setRescheduling(false)} className="text-zinc-500 hover:text-white text-xs">Cancel</button>
            </div>
          )}
        </div>

        {/* Kebab menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 top-8 z-50 w-40 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl"
              >
                {['DRAFT', 'SCHEDULED'].includes(post.status) && (
                  <>
                    <button
                      onClick={() => { setRescheduling(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        setBusy(true);
                        try { await onCancel(); } finally { setBusy(false); }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function PostsView({ accounts }: { accounts: SocialAccount[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | ''>('');
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | ''>('');

  const { posts, loading, error, refresh, cancelPost, reschedule, applyFilters } = useSocialPosts();

  const filtered = posts.filter((p) =>
    p.content.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFilterChange = (status: PostStatus | '', platform: SocialPlatform | '') => {
    setFilterStatus(status);
    setFilterPlatform(platform);
    applyFilters({
      status: status || undefined,
      platform: platform || undefined,
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value as PostStatus | '', filterPlatform)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 focus:outline-none focus:border-primary/30 transition-colors"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => handleFilterChange(filterStatus, e.target.value as SocialPlatform | '')}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 focus:outline-none focus:border-primary/30 transition-colors"
        >
          <option value="">All Platforms</option>
          {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <button onClick={() => { void refresh(); }} className="p-2 rounded-xl border border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 h-40 justify-center text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 h-40 justify-center text-center">
          <p className="text-zinc-400 text-sm">No posts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onCancel={async () => { await cancelPost(post.id); }}
                onReschedule={async (at) => {
                  await reschedule(post.id, at);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            accounts={accounts}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); refresh(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
