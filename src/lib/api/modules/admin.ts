'use client';

import { createApiClient } from '../client';

const tenantClient = createApiClient('/api/tenants');
const adminEmailClient = createApiClient('/api/admin/email');

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