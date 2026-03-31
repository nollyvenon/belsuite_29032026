'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, Send,
  ChevronDown, ChevronUp, Hash, X,
} from 'lucide-react';
import type { SocialAccount, SocialPlatform } from '@/hooks/useSocial';
import { useAutoCreator, useOptimalTimes } from '@/hooks/useSocial';
import { PlatformBadge, PLATFORM_ICONS } from './PlatformBadge';

const TONES = ['professional', 'casual', 'funny', 'inspirational', 'educational', 'promotional'];

const ALL_PLATFORMS: SocialPlatform[] = [
  'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'PINTEREST', 'WHATSAPP',
];

interface GeneratedPost {
  platform: SocialPlatform;
  postId: string;
  preview: string;
}

function PlatformResult({ post }: { post: GeneratedPost }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{PLATFORM_ICONS[post.platform]}</span>
        <PlatformBadge platform={post.platform} />
        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
      </div>
      <p className="text-sm text-zinc-300 line-clamp-3">{post.preview}</p>
    </motion.div>
  );
}

function OptimalTimePicker({
  platform,
  enabled,
  onEnable,
  manualDate,
  onManualDate,
}: {
  platform: SocialPlatform | null;
  enabled: boolean;
  onEnable: (v: boolean) => void;
  manualDate: string;
  onManualDate: (v: string) => void;
}) {
  const { slots, loading } = useOptimalTimes(enabled ? platform : null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEnable(!enabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            enabled
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          AI Optimal Time
        </button>

        {!enabled && (
          <input
            type="datetime-local"
            value={manualDate}
            onChange={(e) => onManualDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40 transition-colors"
          />
        )}
      </div>

      {enabled && (
        <div className="pl-1">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading optimal slots…
            </div>
          ) : slots.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {slots.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="text-[10px] text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(s).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500">
              Select a platform below to see optimal slots
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AICreatorPanel({ accounts }: { accounts: SocialAccount[] }) {
  const { generating, generate } = useAutoCreator();

  const [prompt, setPrompt]             = useState('');
  const [tone, setTone]                 = useState('professional');
  const [selectedPlatforms, setPlats]   = useState<Set<SocialPlatform>>(new Set());
  const [useOptimal, setUseOptimal]     = useState(true);
  const [scheduledAt, setScheduledAt]   = useState('');
  const [results, setResults]           = useState<GeneratedPost[]>([]);
  const [error, setError]               = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Primary platform for optimal-time preview
  const primaryPlatform = Array.from(selectedPlatforms)[0] ?? null;

  const togglePlatform = (p: SocialPlatform) => {
    setPlats((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Please provide a topic or prompt.'); return; }
    if (selectedPlatforms.size === 0) { setError('Select at least one platform.'); return; }

    setError('');
    setResults([]);

    // Map platform selection to account IDs
    const accountIds = accounts
      .filter((a) => selectedPlatforms.has(a.platform))
      .map((a) => a.id);

    try {
      const res = await generate({
        prompt: prompt.trim(),
        platforms: Array.from(selectedPlatforms),
        tone,
        useOptimalTime: useOptimal,
        scheduledAt: !useOptimal && scheduledAt ? scheduledAt : undefined,
        accountIds: accountIds.length ? accountIds : undefined,
      } as any);

      setResults(res.posts ?? []);
      if (!res.posts?.length) {
        setError('No posts were generated. Check that connected accounts exist for selected platforms.');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left: Configuration panel */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">AI Content Creator</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Describe your topic and AI will write platform-optimised posts, then schedule them automatically.
          </p>
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
            Topic / Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Announce our summer sale — 30% off all products. Highlight urgency and include a link to the store."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Tone selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
                  tone === t
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
            Target Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => {
              const connected = connectedPlatforms.has(p);
              const selected  = selectedPlatforms.has(p);
              return (
                <button
                  key={p}
                  onClick={() => connected && togglePlatform(p)}
                  title={!connected ? 'Not connected — go to Accounts tab' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    !connected
                      ? 'border-white/5 text-zinc-700 cursor-not-allowed'
                      : selected
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  <span>{PLATFORM_ICONS[p]}</span>
                  {p === 'TWITTER' ? 'X' : p === 'WHATSAPP' ? 'WhatsApp' : p.charAt(0) + p.slice(1).toLowerCase()}
                  {!connected && <span className="text-[9px] text-zinc-700 ml-0.5">(unlinked)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scheduling */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
            Scheduling
          </label>
          <OptimalTimePicker
            platform={primaryPlatform}
            enabled={useOptimal}
            onEnable={setUseOptimal}
            manualDate={scheduledAt}
            onManualDate={setScheduledAt}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate button */}
        <button
          disabled={generating || !prompt.trim() || selectedPlatforms.size === 0}
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-40 transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {selectedPlatforms.size} post{selectedPlatforms.size !== 1 ? 's' : ''}…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate &amp; Schedule {selectedPlatforms.size > 0 ? `(${selectedPlatforms.size})` : ''}
            </>
          )}
        </button>
      </div>

      {/* Right: Results panel */}
      <div>
        <h3 className="text-base font-bold text-white mb-4">Generated Posts</h3>

        {results.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              Generated posts will appear here after you click "Generate &amp; Schedule".
            </p>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-zinc-400">AI is writing your posts…</p>
          </div>
        )}

        <AnimatePresence>
          <div className="space-y-3">
            {results.map((post) => (
              <PlatformResult key={post.postId} post={post} />
            ))}
          </div>
        </AnimatePresence>

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {results.length} post{results.length !== 1 ? 's' : ''} created &amp; scheduled
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              View them in the Posts or Calendar tab.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
