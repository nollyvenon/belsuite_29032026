'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  X, Sparkles, Clock, RotateCcw, Loader2, Hash, Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import type { SocialAccount, SocialPlatform, CreatePostInput } from '@/hooks/useSocial';
import { useSocialPosts, useOptimalTimes, useAutoCreator } from '@/hooks/useSocial';
import { PLATFORM_ICONS } from './PlatformBadge';

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  TWITTER: 280,
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  TIKTOK: 2200,
  LINKEDIN: 3000,
  PINTEREST: 800,
  WHATSAPP: 4096,
};

function AccountSelector({
  accounts,
  selected,
  onToggle,
}: {
  accounts: SocialAccount[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300">No connected accounts. Go to the Accounts tab to connect.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((a) => (
        <button
          key={a.id}
          onClick={() => onToggle(a.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            selected.has(a.id)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
          }`}
        >
          <span>{PLATFORM_ICONS[a.platform]}</span>
          {a.displayName || a.platformUsername}
        </button>
      ))}
    </div>
  );
}

export function CreatePostModal({
  accounts,
  onClose,
  onCreated,
  initialContent = '',
}: {
  accounts: SocialAccount[];
  onClose: () => void;
  onCreated: () => void;
  initialContent?: string;
}) {
  const { createPost } = useSocialPosts();
  const { generating, generateCaption } = useAutoCreator();

  const [content, setContent]           = useState(initialContent);
  const [hashtags, setHashtags]         = useState('');
  const [link, setLink]                 = useState('');
  const [selectedAccounts, setSelected] = useState<Set<string>>(new Set());
  const [scheduledAt, setScheduledAt]   = useState('');
  const [useOptimal, setUseOptimal]     = useState(false);
  const [autoRepost, setAutoRepost]     = useState(false);
  const [repostDays, setRepostDays]     = useState(7);
  const [maxReposts, setMaxReposts]     = useState(3);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [aiPrompt, setAiPrompt]         = useState('');
  const [showAI, setShowAI]             = useState(false);

  // Determine primary platform for char limit
  const primaryPlatform = accounts.find((a) => selectedAccounts.has(a.id))?.platform ?? 'INSTAGRAM';
  const limit = CHAR_LIMITS[primaryPlatform];
  const charCount = content.length;
  const overLimit = charCount > limit;

  const { slots } = useOptimalTimes(
    useOptimal && selectedAccounts.size > 0
      ? (accounts.find((a) => selectedAccounts.has(a.id))?.platform ?? null)
      : null,
  );

  const toggleAccount = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      const result = await generateCaption(aiPrompt, primaryPlatform);
      setContent(result.caption);
      setHashtags(result.hashtags.join(' '));
      setShowAI(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Content is required'); return; }
    if (selectedAccounts.size === 0) { setError('Select at least one account'); return; }
    if (overLimit) { setError(`Content exceeds ${limit} characters for ${primaryPlatform}`); return; }

    setSaving(true);
    setError('');
    try {
      const input: CreatePostInput = {
        content: content.trim(),
        hashtags: hashtags.split(/\s+/).filter(Boolean).map((h) => h.replace(/^#/, '')),
        link: link.trim() || undefined,
        accountIds: Array.from(selectedAccounts),
        scheduledAt: scheduledAt || undefined,
        useOptimalTime: useOptimal,
        autoRepostEnabled: autoRepost,
        repostIntervalDays: autoRepost ? repostDays : undefined,
        maxReposts: autoRepost ? maxReposts : undefined,
      };
      await createPost(input);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl glass rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-base font-bold text-white">Create Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Account selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Post To</label>
            <AccountSelector accounts={accounts} selected={selectedAccounts} onToggle={toggleAccount} />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Content</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-zinc-500'}`}>
                  {charCount}/{limit}
                </span>
                <button
                  onClick={() => setShowAI(!showAI)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> AI
                </button>
              </div>
            </div>

            {showAI && (
              <div className="mb-2 flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what to write…"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={generating}
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What do you want to share?"
              className={`w-full px-3.5 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none transition-colors leading-relaxed ${
                overLimit ? 'border-red-400/40 focus:border-red-400/60' : 'border-white/10 focus:border-primary/40'
              }`}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              <Hash className="w-3 h-3" /> Hashtags
            </label>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#marketing #brand #product"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Link */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              <LinkIcon className="w-3 h-3" /> Link (optional)
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                <Clock className="w-3 h-3" /> Schedule At
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => { setScheduledAt(e.target.value); setUseOptimal(false); }}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={() => { setUseOptimal(!useOptimal); if (!useOptimal) setScheduledAt(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  useOptimal
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {useOptimal ? 'Using AI optimal time' : 'Use AI optimal time'}
              </button>
              {useOptimal && slots.length > 0 && (
                <p className="text-[10px] text-zinc-500 mt-1">
                  Next slot: {new Date(slots[0]).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Auto-repost */}
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer">
                <RotateCcw className="w-4 h-4 text-primary" />
                Auto-Repost
              </label>
              <button
                onClick={() => setAutoRepost(!autoRepost)}
                className={`w-10 h-5 rounded-full transition-colors relative ${autoRepost ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoRepost ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {autoRepost && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Repost every (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={repostDays}
                    onChange={(e) => setRepostDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Max reposts</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxReposts}
                    onChange={(e) => setMaxReposts(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={saving || !content.trim() || selectedAccounts.size === 0}
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {scheduledAt || useOptimal ? 'Schedule Post' : 'Publish Now'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
