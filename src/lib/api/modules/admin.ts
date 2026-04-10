'use client';

import { createApiClient } from '../client';

const tenantClient = createApiClient('/api/tenants');
const adminEmailClient = createApiClient('/api/admin/email');
const aiGatewayAdminClient = createApiClient('/admin/ai-gateway');

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  email?: string;
  tier?: string;
  isActive?: boolean;
  createdAt?: string;
  tenantOnboarding?: {
    step?: string;
    completed?: boolean;
  } | null;
}

export interface TenantListResponse {
  tenants: TenantSummary[];
  total: number;
  skip: number;
  take: number;
}

export interface AdminEmailSettings {
  organizationId: string;
  primaryProvider: string;
  emailFrom: string;
  emailFromName: string;
  replyTo?: string;
  enableFailover: boolean;
  fallbackProviders: string[];
  maxRetries: number;
  retryDelayMs: number;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  trackingEnabled: boolean;
  webhooksEnabled: boolean;
  attachmentsEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testStatus?: string;
}

export interface EmailProviderConfig {
  id: string;
  name: string;
  description: string;
  pricing: string;
  maxEmailsPerSecond: number;
  features: string[];
}

export async function listTenants(skip = 0, take = 12) {
  return tenantClient.get<TenantListResponse>('/', { skip, take });
}

export async function updateTenant(tenantId: string, payload: { name?: string; tier?: string; metadata?: Record<string, unknown> }) {
  return tenantClient.put<TenantSummary>(`/${tenantId}`, payload);
}

export async function getEmailSettings() {
  return adminEmailClient.get<AdminEmailSettings>('/settings');
}

export async function updateEmailSettings(payload: Partial<AdminEmailSettings>) {
  return adminEmailClient.put<AdminEmailSettings>('/settings', payload);
}

export async function getEmailProviders() {
  return adminEmailClient.get<EmailProviderConfig[]>('/providers');
}

export async function getEmailHealth() {
  return adminEmailClient.get<Record<string, unknown>>('/health');
}

export interface AIGatewayControlProfile {
  mode: 'CHEAP' | 'BALANCED' | 'PREMIUM';
  dynamicEnabled: boolean;
  weights: {
    cost: number;
    quality: number;
    speed: number;
  };
  cheapProviders: string[];
  premiumProviders: string[];
}

export interface AIGatewayUsageLimits {
  maxTokensPerRequest: number;
  maxBatchRequests: number;
  maxFailoverModels: number;
}

export interface AIGatewayDashboard {
  stats: Record<string, any>;
  cache: Record<string, any>;
  healthSummary: Record<string, any>;
  modelSummary: Record<string, any>;
  budgets: Record<string, any>;
  toggles: Array<{ key: string; enabled: boolean }>;
  profile: AIGatewayControlProfile;
  limits: AIGatewayUsageLimits;
}

export interface AITaskCatalogEntry {
  taskKey: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

export interface AITaskRouteEntry {
  primaryModelId: string;
  fallbackModelIds?: string[];
  strategy?: 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom';
  maxCostUsdPerRequest?: number | null;
  maxLatencyMs?: number | null;
  isActive?: boolean;
}

export interface AIUsageTimelinePoint {
  day: string;
  requests: number;
  costUsd: number;
  tokens: number;
}

export interface AITaskMetric {
  taskKey: string;
  requests: number;
  successRatePct: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

export async function getAIGatewayDashboard() {
  return aiGatewayAdminClient.get<AIGatewayDashboard>('/dashboard');
}

export async function getAIGatewayControlProfile() {
  return aiGatewayAdminClient.get<AIGatewayControlProfile>('/control-profile');
}

export async function updateAIGatewayControlProfile(payload: Partial<AIGatewayControlProfile>) {
  return aiGatewayAdminClient.put<AIGatewayControlProfile>('/control-profile', payload);
}

export async function getAIGatewayUsageLimits() {
  return aiGatewayAdminClient.get<AIGatewayUsageLimits>('/limits');
}

export async function updateAIGatewayUsageLimits(payload: Partial<AIGatewayUsageLimits>) {
  return aiGatewayAdminClient.put<AIGatewayUsageLimits>('/limits', payload);
}

export async function getFeatureModelLimits() {
  return aiGatewayAdminClient.get<Record<string, string[]>>('/feature-model-limits');
}

export async function setFeatureModelLimit(feature: string, modelIds: string[]) {
  return aiGatewayAdminClient.put<{ feature: string; modelIds: string[] }>('/feature-model-limits', {
    feature,
    modelIds,
  });
}

export async function getGatewayModels() {
  return aiGatewayAdminClient.get<Array<{ id: string; displayName: string; modelId: string; isEnabled: boolean }>>('/models');
}

export async function getTenantUsageLimits() {
  return aiGatewayAdminClient.get<Record<string, { maxTokensPerRequest?: number; maxBatchRequests?: number; maxFailoverModels?: number }>>('/tenant-limits');
}

export async function setTenantUsageLimit(
  organizationId: string,
  payload: { maxTokensPerRequest?: number; maxBatchRequests?: number; maxFailoverModels?: number },
) {
  return aiGatewayAdminClient.put('/tenant-limits', { organizationId, ...payload });
}

export async function getTenantFeatureModelLimits() {
  return aiGatewayAdminClient.get<Record<string, Record<string, string[]>>>('/tenant-feature-model-limits');
}

export async function setTenantFeatureModelLimit(
  organizationId: string,
  feature: string,
  modelIds: string[],
) {
  return aiGatewayAdminClient.put('/tenant-feature-model-limits', { organizationId, feature, modelIds });
}

export async function getTaskCatalog() {
  return aiGatewayAdminClient.get<AITaskCatalogEntry[]>('/tasks');
}

export async function upsertTaskCatalogEntry(payload: AITaskCatalogEntry) {
  return aiGatewayAdminClient.put<AITaskCatalogEntry>('/tasks', payload);
}

export async function deleteTaskCatalogEntry(taskKey: string) {
  return aiGatewayAdminClient.post<{ deleted: boolean; taskKey: string }>('/tasks/delete', { taskKey });
}

export async function getTaskRoutes() {
  return aiGatewayAdminClient.get<Record<string, AITaskRouteEntry>>('/task-routes');
}

export async function setTaskRoute(
  task: string,
  payload: {
    primaryModelId: string;
    fallbackModelIds?: string[];
    strategy?: 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'custom';
    maxCostUsdPerRequest?: number;
    maxLatencyMs?: number;
    isActive?: boolean;
  },
) {
  return aiGatewayAdminClient.put('/task-routes', {
    task,
    ...payload,
  });
}

export async function deleteTaskRoute(task: string) {
  return aiGatewayAdminClient.post<{ deleted: boolean; task: string }>('/task-routes/delete', { task });
}

export async function getAIGatewayUsageChart(days = 30, organizationId?: string) {
  return aiGatewayAdminClient.get<{
    source: 'AIUsageLog' | 'AIGatewayRequest';
    days: number;
    rows: AIUsageTimelinePoint[];
  }>('/usage-chart', {
    days,
    organizationId,
  });
}

export async function getAIGatewayTaskMetrics(days = 30, organizationId?: string) {
  return aiGatewayAdminClient.get<AITaskMetric[]>('/task-metrics', {
    days,
    organizationId,
  });
}