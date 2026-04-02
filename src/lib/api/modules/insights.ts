'use client';

import { createApiClient } from '../client';

const analyticsClient = createApiClient('/api/analytics');
const marketingClient = createApiClient('/api/marketing');
const socialClient = createApiClient('/api/social');
const videoClient = createApiClient('/api/video');
const ugcClient = createApiClient('/api/ugc');
const aiClient = createApiClient('/api/ai');

export interface TrendDataPoint {
  date: string;
  analytics: number;
  marketing: number;
  social: number;
  video: number;
  ugc: number;
  ai: number;
}

export interface PipelineMetrics {
  uploaded: number;
  processing: number;
  review: number;
  published: number;
  successRate: number;
  avgProcessingTime: string;
  failedRenders: number;
  totalRenders: number;
}

export async function getAnalyticsTrends(days = 7): Promise<TrendDataPoint[]> {
  const [analytics, marketing, social, video, ugc, ai] = await Promise.allSettled([
    analyticsClient.get<any>('/trends', { days }),
    marketingClient.get<any>('/performance', { days }),
    socialClient.get<any>('/metrics', { days }),
    videoClient.get<any>('/metrics', { days }),
    ugcClient.get<any>('/metrics', { days }),
    aiClient.get<any>('/usage', { days }),
  ]);

  const sources = {
    analytics: analytics.status === 'fulfilled' ? analytics.value : null,
    marketing: marketing.status === 'fulfilled' ? marketing.value : null,
    social: social.status === 'fulfilled' ? social.value : null,
    video: video.status === 'fulfilled' ? video.value : null,
    ugc: ugc.status === 'fulfilled' ? ugc.value : null,
    ai: ai.status === 'fulfilled' ? ai.value : null,
  };

  const mapByDate = new Map<string, TrendDataPoint>();

  const ensurePoint = (date: string) => {
    if (!mapByDate.has(date)) {
      mapByDate.set(date, {
        date,
        analytics: 0,
        marketing: 0,
        social: 0,
        video: 0,
        ugc: 0,
        ai: 0,
      });
    }
    return mapByDate.get(date)!;
  };

  const mergeSeries = (key: keyof Omit<TrendDataPoint, 'date'>, payload: any) => {
    if (!payload) return;
    const series = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.series)
        ? payload.series
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    for (const point of series) {
      const date = String(point?.date ?? point?.label ?? point?.day ?? '');
      if (!date) continue;
      const value = Number(point?.value ?? point?.count ?? point?.total ?? 0);
      ensurePoint(date)[key] = Number.isFinite(value) ? value : 0;
    }
  };

  mergeSeries('analytics', sources.analytics);
  mergeSeries('marketing', sources.marketing);
  mergeSeries('social', sources.social);
  mergeSeries('video', sources.video);
  mergeSeries('ugc', sources.ugc);
  mergeSeries('ai', sources.ai);

  return Array.from(mapByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getContentPipelineMetrics(): Promise<PipelineMetrics> {
  const [videoProjects, ugcDashboard] = await Promise.allSettled([
    videoClient.get<any>('/projects'),
    ugcClient.get<any>('/dashboard'),
  ]);

  const videos = videoProjects.status === 'fulfilled' ? videoProjects.value : [];
  const ugc = ugcDashboard.status === 'fulfilled' ? ugcDashboard.value : null;

  const uploaded = videos.filter((v: any) => v.status === 'DRAFT').length;
  const processing = videos.filter((v: any) => v.status === 'PROCESSING').length;
  const review = videos.filter((v: any) => v.status === 'PENDING_REVIEW').length;
  const published = videos.filter((v: any) => v.status === 'READY').length;

  return {
    uploaded,
    processing,
    review,
    published,
    successRate: Number(ugc?.pipeline?.successRate ?? 0),
    avgProcessingTime: String(ugc?.pipeline?.avgProcessingTime ?? '0m 0s'),
    failedRenders: Number(ugc?.pipeline?.failedRenders ?? 0),
    totalRenders: Number(ugc?.pipeline?.totalRenders ?? videos.length),
  };
}
