'use client';

import { useCallback, useEffect, useState } from 'react';

export type UGCProjectStatus = 'DRAFT' | 'SCRIPTING' | 'RENDERING' | 'READY' | 'PUBLISHED' | 'FAILED';
export type AvatarStyle = 'INFLUENCER' | 'PROFESSIONAL' | 'CASUAL' | 'PRESENTER' | 'NARRATOR';
export type AvatarProvider = 'HEYGEN' | 'DID' | 'TAVUS' | 'SYNTHESIA' | 'MOCK';
export type VoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL';
export type RenderStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface UGCAvatar {
  id: string;
  name: string;
  description?: string;
  style: AvatarStyle;
  provider: AvatarProvider;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  gender: VoiceGender;
  ethnicityHint?: string;
  ageRange?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface VoiceClone {
  id: string;
  name: string;
  description?: string;
  provider: string;
  sampleAudioUrl?: string;
  gender: VoiceGender;
  language: string;
  accent?: string;
  stability: number;
  similarityBoost: number;
  styleExaggeration: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface UGCScript {
  id: string;
  content: string;
  aiGenerated: boolean;
  prompt?: string;
  model?: string;
  scenesJson?: string;
  wordCount?: number;
  estimatedSecs?: number;
  version: number;
  updatedAt: string;
}

export interface UGCRender {
  id: string;
  status: RenderStatus;
  provider: string;
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  settingsJson?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface UGCProject {
  id: string;
  title: string;
  description?: string;
  brandContext?: string;
  aspectRatio: string;
  durationSeconds?: number;
  platform?: string;
  status: UGCProjectStatus;
  outputUrl?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  avatarId?: string;
  voiceCloneId?: string;
  avatar?: Pick<UGCAvatar, 'id' | 'name' | 'style' | 'thumbnailUrl'> | UGCAvatar | null;
  voiceClone?: Pick<VoiceClone, 'id' | 'name' | 'provider'> | VoiceClone | null;
  script?: UGCScript | null;
  renders?: UGCRender[];
}

export interface UGCDashboardOverview {
  totalProjects: number;
  readyProjects: number;
  publishedProjects: number;
  avatarsAvailable: number;
  voiceClonesAvailable: number;
  rendersInFlight: number;
  recentProjects: Array<{
    id: string;
    title: string;
    status: UGCProjectStatus;
    updatedAt: string;
    avatarName: string | null;
    outputUrl: string | null;
  }>;
}

function authHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ugc${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useUGCDashboard() {
  const [overview, setOverview] = useState<UGCDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await apiFetch<UGCDashboardOverview>('/dashboard'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { overview, loading, error, reload: load };
}

export function useUGCProjects() {
  const [projects, setProjects] = useState<UGCProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await apiFetch<UGCProject[]>('/projects'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProject = useCallback(
    async (dto: {
      title: string;
      description?: string;
      avatarId?: string;
      voiceCloneId?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      platform?: string;
    }) => {
      const project = await apiFetch<UGCProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await load();
      return project;
    },
    [load],
  );

  const updateProject = useCallback(
    async (projectId: string, dto: Partial<UGCProject>) => {
      const project = await apiFetch<UGCProject>(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await load();
      return project;
    },
    [load],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return { projects, loading, error, reload: load, createProject, updateProject, deleteProject };
}

export function useUGCAvatars() {
  const [avatars, setAvatars] = useState<UGCAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAvatars(await apiFetch<UGCAvatar[]>('/avatars'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createAvatar = useCallback(
    async (dto: Partial<UGCAvatar> & { name: string }) => {
      const avatar = await apiFetch<UGCAvatar>('/avatars', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await load();
      return avatar;
    },
    [load],
  );

  const updateAvatar = useCallback(
    async (avatarId: string, dto: Partial<UGCAvatar>) => {
      const avatar = await apiFetch<UGCAvatar>(`/avatars/${avatarId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await load();
      return avatar;
    },
    [load],
  );

  return { avatars, loading, error, reload: load, createAvatar, updateAvatar };
}

export function useVoiceClones() {
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVoiceClones(await apiFetch<VoiceClone[]>('/voices'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createVoiceClone = useCallback(
    async (dto: Partial<VoiceClone> & { name: string }) => {
      const clone = await apiFetch<VoiceClone>('/voices', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await load();
      return clone;
    },
    [load],
  );

  const updateVoiceClone = useCallback(
    async (voiceCloneId: string, dto: Partial<VoiceClone>) => {
      const clone = await apiFetch<VoiceClone>(`/voices/${voiceCloneId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await load();
      return clone;
    },
    [load],
  );

  return { voiceClones, loading, error, reload: load, createVoiceClone, updateVoiceClone };
}

export function useUGCStudio(projectId: string) {
  const [project, setProject] = useState<UGCProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProject(await apiFetch<UGCProject>(`/projects/${projectId}`));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const generateScript = useCallback(
    async (dto: {
      objective: 'awareness' | 'engagement' | 'conversions' | 'retention';
      platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook';
      durationSeconds: number;
      productOrOffer: string;
      targetAudience: string;
      callToAction?: string;
      talkingPoints?: string[];
    }) => {
      setSaving(true);
      try {
        const result = await apiFetch<any>(`/projects/${projectId}/generate-script`, {
          method: 'POST',
          body: JSON.stringify(dto),
        });
        await load();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [projectId, load],
  );

  const saveScript = useCallback(
    async (content: string, scenesJson?: string) => {
      setSaving(true);
      try {
        const result = await apiFetch<UGCScript>(`/projects/${projectId}/script`, {
          method: 'PUT',
          body: JSON.stringify({ content, scenesJson }),
        });
        await load();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [projectId, load],
  );

  const renderProject = useCallback(
    async (dto: {
      faceAnimation?: boolean;
      lipSyncIntensity?: number;
      resolution?: '720p' | '1080p' | '4k';
      enableCaptions?: boolean;
      backgroundMusic?: boolean;
      aspectRatio?: '9:16' | '1:1' | '16:9';
    }) => {
      setSaving(true);
      try {
        const result = await apiFetch<UGCRender>(`/projects/${projectId}/render`, {
          method: 'POST',
          body: JSON.stringify(dto),
        });
        await load();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [projectId, load],
  );

  const publishProject = useCallback(async () => {
    setSaving(true);
    try {
      const result = await apiFetch<UGCProject>(`/projects/${projectId}/publish`, {
        method: 'POST',
      });
      await load();
      return result;
    } finally {
      setSaving(false);
    }
  }, [projectId, load]);

  const listRenders = useCallback(async () => {
    return apiFetch<UGCRender[]>(`/projects/${projectId}/renders`);
  }, [projectId]);

  return {
    project,
    loading,
    saving,
    error,
    reload: load,
    generateScript,
    saveScript,
    renderProject,
    publishProject,
    listRenders,
  };
}