'use client';

import { useState, useCallback, useEffect } from 'react';
import { trackAnalyticsEvent } from '@/hooks/useAnalytics';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'TWITTER' | 'LINKEDIN' | 'PINTEREST' | 'WHATSAPP';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
export type PublishStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername?: string;
  displayName?: string;
  avatar?: string;
  pageId?: string;
  pageName?: string;
  isActive: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
  _count?: { posts: number };
}

export interface PublishResult {
  id: string;
  platform: SocialPlatform;
  status: PublishStatus;
  platformUrl?: string;
  errorMessage?: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls: string[];
  link?: string;
  hashtags: string[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  aiGenerated: boolean;
  optimalTimeUsed: boolean;
  autoRepostEnabled: boolean;
  repostIntervalDays?: number;
  maxReposts?: number;
  repostCount: number;
  bulkBatchId?: string;
  createdAt: string;
  updatedAt: string;
  accounts: Array<{ account: { id: string; platform: SocialPlatform; displayName?: string; avatar?: string } }>;
  publishResults: PublishResult[];
  _count?: { reposts: number };
}

export interface BulkBatch {
  id: string;
  name: string;
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  status: string;
  createdAt: string;
}

export interface CalendarDay {
  date: string;
  posts: Array<{
    id: string;
    content: string;
    scheduledAt: string;
    status: PostStatus;
    platforms: SocialPlatform[];
  }>;
}

export interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  link?: string;
  hashtags?: string[];
  accountIds: string[];
  scheduledAt?: string;
  autoRepostEnabled?: boolean;
  repostIntervalDays?: number;
  maxReposts?: number;
  useOptimalTime?: boolean;
}

export interface BulkCreateInput {
  name: string;
  posts: CreatePostInput[];
}

export interface AutoCreatorInput {
  prompt: string;
  platforms: SocialPlatform[];
  tone?: string;
  useOptimalTime?: boolean;
  scheduledAt?: string;
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function authHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Accounts hook ─────────────────────────────────────────────────────────────

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SocialAccount[]>('/api/social/accounts');
      setAccounts(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const disconnect = useCallback(async (id: string) => {
    await apiFetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getOAuthUrl = useCallback(async (platform: SocialPlatform, redirectUri: string): Promise<string> => {
    const data = await apiFetch<{ url: string }>(
      `/api/social/accounts/${platform}/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
    return data.url;
  }, []);

  return { accounts, loading, error, refresh: load, disconnect, getOAuthUrl };
}

// ── Posts hook ────────────────────────────────────────────────────────────────

export interface PostFilters {
  status?: PostStatus;
  platform?: SocialPlatform;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useSocialPosts(initialFilters?: PostFilters) {
  const [posts, setPosts]     = useState<ScheduledPost[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filters, setFilters] = useState<PostFilters>(initialFilters ?? {});

  const load = useCallback(async (f?: PostFilters) => {
    const active = f ?? filters;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (active.status)   params.set('status', active.status);
      if (active.platform) params.set('platform', active.platform);
      if (active.from)     params.set('from', active.from);
      if (active.to)       params.set('to', active.to);
      if (active.page)     params.set('page', String(active.page));
      if (active.limit)    params.set('limit', String(active.limit));

      const data = await apiFetch<{
        data: ScheduledPost[];
        meta: { total: number; page: number; totalPages: number };
      }>(`/api/social/posts?${params}`);

      setPosts(data.data);
      setTotal(data.meta.total);
      setPage(data.meta.page);
      setTotalPages(data.meta.totalPages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    const post = await apiFetch<ScheduledPost>('/api/social/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setPosts((prev) => [post, ...prev]);
    trackAnalyticsEvent({
      eventType: 'social_post_created',
      entityType: 'SOCIAL_POST',
      entityId: post.id,
      channel: 'SOCIAL',
      source: 'APP',
      properties: {
        accountCount: input.accountIds.length,
        mediaCount: input.mediaUrls?.length ?? 0,
        scheduled: Boolean(input.scheduledAt),
        useOptimalTime: input.useOptimalTime,
        autoRepostEnabled: input.autoRepostEnabled,
        platformCount: post.accounts.length,
      },
    });
    return post;
  }, []);

  const updatePost = useCallback(async (id: string, input: Partial<CreatePostInput>) => {
    const post = await apiFetch<ScheduledPost>(`/api/social/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
    trackAnalyticsEvent({
      eventType: 'social_post_updated',
      entityType: 'SOCIAL_POST',
      entityId: id,
      channel: 'SOCIAL',
      source: 'APP',
      properties: {
        fieldsUpdated: Object.keys(input),
      },
    });
    return post;
  }, []);

  const cancelPost = useCallback(async (id: string) => {
    await apiFetch(`/api/social/posts/${id}`, { method: 'DELETE' });
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'CANCELLED' as PostStatus } : p));
    trackAnalyticsEvent({
      eventType: 'social_post_cancelled',
      entityType: 'SOCIAL_POST',
      entityId: id,
      channel: 'SOCIAL',
      source: 'APP',
    });
  }, []);

  const reschedule = useCallback(async (id: string, scheduledAt: string) => {
    const post = await apiFetch<ScheduledPost>(`/api/social/posts/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ scheduledAt }),
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
    trackAnalyticsEvent({
      eventType: 'social_post_rescheduled',
      entityType: 'SOCIAL_POST',
      entityId: id,
      channel: 'SOCIAL',
      source: 'APP',
      properties: { scheduledAt },
    });
    return post;
  }, []);

  const applyFilters = useCallback((f: PostFilters) => {
    setFilters(f);
    load(f);
  }, [load]);

  return {
    posts, total, page, totalPages, loading, error,
    refresh: load, createPost, updatePost, cancelPost, reschedule, applyFilters,
  };
}

// ── Calendar hook ─────────────────────────────────────────────────────────────

export function useCalendar(from: Date, to: Date) {
  const [days, setDays]       = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CalendarDay[]>(
        `/api/social/calendar?from=${fromIso}&to=${toIso}`,
      );
      setDays(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fromIso, toIso]);

  useEffect(() => { load(); }, [load]);

  return { days, loading, error, refresh: load };
}

// ── Bulk hook ─────────────────────────────────────────────────────────────────

export function useBulk() {
  const [batches, setBatches] = useState<BulkBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BulkBatch[]>('/api/social/bulk');
      setBatches(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createBulk = useCallback(async (input: BulkCreateInput) => {
    const result = await apiFetch<{ batchId: string; created: number; failed: number }>(
      '/api/social/bulk',
      { method: 'POST', body: JSON.stringify(input) },
    );
    trackAnalyticsEvent({
      eventType: 'social_bulk_created',
      entityType: 'SOCIAL_BULK_BATCH',
      entityId: result.batchId,
      channel: 'SOCIAL',
      source: 'APP',
      value: result.created,
      properties: {
        batchName: input.name,
        requestedPosts: input.posts.length,
        created: result.created,
        failed: result.failed,
      },
    });
    await load();
    return result;
  }, [load]);

  return { batches, loading, error, refresh: load, createBulk };
}

// ── AI creator hook ───────────────────────────────────────────────────────────

export function useAutoCreator() {
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (input: AutoCreatorInput) => {
    setGenerating(true);
    try {
      const result = await apiFetch<{ posts: Array<{ platform: SocialPlatform; postId: string; preview: string }> }>(
        '/api/social/ai/generate',
        { method: 'POST', body: JSON.stringify(input) },
      );
      trackAnalyticsEvent({
        eventType: 'social_ai_posts_generated',
        entityType: 'SOCIAL_AI_BATCH',
        entityId: result.posts[0]?.postId,
        channel: 'SOCIAL',
        source: 'APP',
        value: result.posts.length,
        properties: {
          promptLength: input.prompt.length,
          platformCount: input.platforms.length,
          tone: input.tone,
          scheduledAt: input.scheduledAt,
          generatedPosts: result.posts.length,
        },
      });
      return result;
    } finally {
      setGenerating(false);
    }
  }, []);

  const generateCaption = useCallback(async (content: string, platform: SocialPlatform, tone?: string) => {
    const result = await apiFetch<{ caption: string; hashtags: string[] }>(
      '/api/social/ai/caption',
      { method: 'POST', body: JSON.stringify({ content, platform, tone }) },
    );
    trackAnalyticsEvent({
      eventType: 'social_caption_generated',
      entityType: 'SOCIAL_CAPTION',
      entityId: platform,
      channel: 'SOCIAL',
      source: 'APP',
      value: result.hashtags.length,
      properties: {
        platform,
        tone,
        contentLength: content.length,
        hashtagCount: result.hashtags.length,
      },
    });
    return result;
  }, []);

  return { generating, generate, generateCaption };
}

// ── Optimal times hook ────────────────────────────────────────────────────────

export function useOptimalTimes(platform: SocialPlatform | null) {
  const [slots, setSlots] = useState<string[]>([]);
  const [resolvedPlatform, setResolvedPlatform] = useState<SocialPlatform | null>(null);

  const loading = Boolean(platform && platform !== resolvedPlatform);

  useEffect(() => {
    if (!platform) return;

    let cancelled = false;

    apiFetch<string[]>(`/api/social/optimal-times/${platform}?count=5`)
      .then((nextSlots) => {
        if (cancelled) return;
        setSlots(nextSlots);
        setResolvedPlatform(platform);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setResolvedPlatform(platform);
      });

    return () => {
      cancelled = true;
    };
  }, [platform]);

  return { slots: platform ? slots : [], loading };
}

// ── Retry dashboard hook ──────────────────────────────────────────────────────

export interface FailedResult {
  id: string;
  errorMessage?: string;
  attemptCount: number;
  lastAttemptAt: string;
  post: {
    id: string;
    content: string;
    mediaUrls: string[];
    scheduledAt?: string;
    status: PostStatus;
  };
  account: {
    id: string;
    platform: SocialPlatform;
    platformUsername?: string;
  };
}

export interface PublishStats {
  period: string;
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  successRate: number | null;
  platforms: Record<string, { success: number; failed: number; pending: number }>;
}

export function useRetryDashboard() {
  const [failed, setFailed]     = useState<FailedResult[]>([]);
  const [stats, setStats]       = useState<PublishStats | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [failedData, statsData] = await Promise.all([
        apiFetch<FailedResult[]>('/api/social/failed'),
        apiFetch<PublishStats>('/api/social/stats'),
      ]);
      setFailed(failedData);
      setStats(statsData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const retryResult = useCallback(async (resultId: string) => {
    await apiFetch(`/api/social/failed/${resultId}/retry`, { method: 'POST' });
    await load();
  }, [load]);

  const dismissResult = useCallback(async (resultId: string) => {
    await apiFetch(`/api/social/failed/${resultId}`, { method: 'DELETE' });
    setFailed((prev) => prev.filter((r) => r.id !== resultId));
  }, []);

  return { failed, stats, loading, error, reload: load, retryResult, dismissResult };
}

// ── WhatsApp recipients hook ──────────────────────────────────────────────────

export function useWhatsAppRecipients(accountId: string | null) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    apiFetch<string[]>(`/api/social/accounts/${accountId}/whatsapp-recipients`)
      .then(setRecipients)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountId]);

  const save = useCallback(async (updated: string[]) => {
    if (!accountId) return;
    setSaving(true);
    try {
      const result = await apiFetch<{ recipients: string[] }>(
        `/api/social/accounts/${accountId}/whatsapp-recipients`,
        {
          method: 'PATCH',
          body: JSON.stringify({ recipients: updated }),
        },
      );
      setRecipients(result.recipients);
    } finally {
      setSaving(false);
    }
  }, [accountId]);

  return { recipients, loading, saving, save };
}
