/**
 * API Service Layer
 * Centralized API calls for all backend services
 * Demo mode uses mock data; production uses real API calls
 */

/** Base for API calls. Empty string = same-origin (Next rewrites `/api/*` to Laravel). */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';


// ============================================
// TYPES
// ============================================

function isDemoRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/demo');
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  score: number;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  source: string;
  lastActive: string;
}

export interface DashboardMetrics {
  leads: number;
  leadsChange: number;
  conversion: number;
  conversionChange: number;
  revenue: number;
  revenueChange: number;
  aiTokens: number;
  aiTokensChange: number;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  status: 'Active' | 'Inactive';
  executionCount: number;
}

export interface AIOutput {
  id: string;
  type: 'social' | 'email' | 'ad' | 'linkedin' | 'video' | 'script' | 'blog';
  content: string;
  timestamp: string;
}

export interface UsageData {
  tokensUsed: number;
  tokenLimit: number;
  costUsed: number;
  costLimit: number;
  breakdown: Record<string, number>;
}

// ============================================
// LEADS API
// ============================================

export const leadsApi = {
  async list(params?: any): Promise<Lead[]> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_LEADS } = await import('./demo-data-expanded');
      return ENHANCED_MOCK_LEADS;
    }

    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/leads?${query}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch leads: ${res.statusText}`);
    const result: ApiResponse<Lead[]> = await res.json();
    return result.data || [];
  },

  async get(id: string): Promise<Lead | null> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_LEADS } = await import('./demo-data-expanded');
      return ENHANCED_MOCK_LEADS.find(l => l.id === id) || null;
    }

    const res = await fetch(`${API_BASE}/leads/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    const result: ApiResponse<Lead> = await res.json();
    return result.data || null;
  },

  async create(data: Partial<Lead>): Promise<Lead> {
    if (isDemoRoute()) {
      return { id: Date.now().toString(), ...data } as Lead;
    }

    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create lead');
    const result: ApiResponse<Lead> = await res.json();
    return result.data!;
  },

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_LEADS } = await import('./demo-data-expanded');
      const lead = ENHANCED_MOCK_LEADS.find(l => l.id === id);
      return lead ? { ...lead, ...data } : ({ id, ...data } as Lead);
    }

    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    const result: ApiResponse<Lead> = await res.json();
    return result.data!;
  },

  async delete(id: string): Promise<void> {
    if (isDemoRoute()) return;

    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to delete lead');
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_STATS } = await import('./demo-data-expanded');
      return {
        leads: ENHANCED_MOCK_STATS.leads,
        leadsChange: ENHANCED_MOCK_STATS.leadsGrowth,
        conversion: ENHANCED_MOCK_STATS.conversion,
        conversionChange: ENHANCED_MOCK_STATS.conversionGrowth,
        revenue: ENHANCED_MOCK_STATS.revenue,
        revenueChange: ENHANCED_MOCK_STATS.revenueGrowth,
        aiTokens: ENHANCED_MOCK_STATS.aiUsage,
        aiTokensChange: ENHANCED_MOCK_STATS.aiUsageLimit,
      };
    }

    const res = await fetch(`${API_BASE}/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    const result: ApiResponse<DashboardMetrics> = await res.json();
    return result.data!;
  },

  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_ACTIVITY } = await import('./demo-data-expanded');
      return ENHANCED_MOCK_ACTIVITY.map(item => ({
        id: item.id,
        type: item.type,
        description: item.message,
        timestamp: item.time,
      }));
    }

    const res = await fetch(`${API_BASE}/dashboard/activity`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch activity');
    const result: ApiResponse<ActivityFeedItem[]> = await res.json();
    return result.data || [];
  },

  async getChartData(): Promise<any[]> {
    if (isDemoRoute()) {
      const { ENHANCED_MOCK_CHART_DATA } = await import('./demo-data-expanded');
      return ENHANCED_MOCK_CHART_DATA;
    }

    const res = await fetch(`${API_BASE}/dashboard/chart-data`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch chart data');
    const result: ApiResponse<any[]> = await res.json();
    return result.data || [];
  },
};

// ============================================
// AI API
// ============================================

export const aiApi = {
  async generate(
    type: 'social' | 'email' | 'ad' | 'linkedin' | 'video' | 'script' | 'blog',
    prompt: string,
    context?: any
  ): Promise<string> {
    if (isDemoRoute()) {
      const { MOCK_AI_OUTPUTS } = await import('./demo-data-expanded');
      const outputs = MOCK_AI_OUTPUTS[type as keyof typeof MOCK_AI_OUTPUTS];
      return Array.isArray(outputs) ? outputs[0] : outputs || '';
    }

    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ type, prompt, context }),
    });
    if (!res.ok) throw new Error('Failed to generate content');
    const result: ApiResponse<{ content: string }> = await res.json();
    return result.data?.content || '';
  },

  async listContentTypes(): Promise<string[]> {
    if (isDemoRoute()) {
      return ['social', 'email', 'ad', 'linkedin', 'video', 'script', 'blog'];
    }

    const res = await fetch(`${API_BASE}/ai/content-types`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch content types');
    const result: ApiResponse<string[]> = await res.json();
    return result.data || [];
  },

  async saveOutput(data: AIOutput): Promise<AIOutput> {
    if (isDemoRoute()) {
      return { ...data, id: Date.now().toString() };
    }

    const res = await fetch(`${API_BASE}/ai/outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save output');
    const result: ApiResponse<AIOutput> = await res.json();
    return result.data!;
  },
};

// ============================================
// AUTOMATION API
// ============================================

export const automationApi = {
  async list(): Promise<Automation[]> {
    if (isDemoRoute()) {
      const { MOCK_AUTOMATIONS } = await import('./demo-data-expanded');
      return MOCK_AUTOMATIONS.map(a => ({
        id: a.id,
        name: a.name,
        trigger: a.trigger,
        actions: a.actions,
        status: a.status as 'Active' | 'Inactive',
        executionCount: a.executions,
      }));
    }

    const res = await fetch(`${API_BASE}/automations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch automations');
    const result: ApiResponse<Automation[]> = await res.json();
    return result.data || [];
  },

  async get(id: string): Promise<Automation | null> {
    if (isDemoRoute()) {
      const { MOCK_AUTOMATIONS } = await import('./demo-data-expanded');
      const auto = MOCK_AUTOMATIONS.find(a => a.id === id);
      return auto ? {
        id: auto.id,
        name: auto.name,
        trigger: auto.trigger,
        actions: auto.actions,
        status: auto.status as 'Active' | 'Inactive',
        executionCount: auto.executions,
      } : null;
    }

    const res = await fetch(`${API_BASE}/automations/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    const result: ApiResponse<Automation> = await res.json();
    return result.data || null;
  },

  async create(data: Partial<Automation>): Promise<Automation> {
    if (isDemoRoute()) {
      return { id: Date.now().toString(), ...data } as Automation;
    }

    const res = await fetch(`${API_BASE}/automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create automation');
    const result: ApiResponse<Automation> = await res.json();
    return result.data!;
  },

  async update(id: string, data: Partial<Automation>): Promise<Automation> {
    if (isDemoRoute()) {
      const { MOCK_AUTOMATIONS } = await import('./demo-data-expanded');
        const auto = MOCK_AUTOMATIONS.find(a => a.id === id);
        return auto ? {
          id: auto.id,
          name: data.name || auto.name,
          trigger: data.trigger || auto.trigger,
          actions: data.actions || auto.actions,
          status: (data.status || auto.status) as 'Active' | 'Inactive',
          executionCount: data.executionCount || auto.executions,
        } : ({ id, ...data } as Automation);
    }

    const res = await fetch(`${API_BASE}/automations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update automation');
    const result: ApiResponse<Automation> = await res.json();
    return result.data!;
  },

  async delete(id: string): Promise<void> {
    if (isDemoRoute()) return;

    const res = await fetch(`${API_BASE}/automations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to delete automation');
  },

  async execute(id: string): Promise<{ success: boolean; message: string }> {
    if (isDemoRoute()) {
      return { success: true, message: 'Automation executed (demo mode)' };
    }

    const res = await fetch(`${API_BASE}/automations/${id}/execute`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to execute automation');
    return await res.json();
  },
};

// ============================================
// ANALYTICS API
// ============================================

export const analyticsApi = {
  async getInsights(): Promise<any[]> {
    if (isDemoRoute()) {
      const { MOCK_ANALYTICS } = await import('./demo-data-expanded');
      return MOCK_ANALYTICS.insights || [];
    }

    const res = await fetch(`${API_BASE}/analytics/insights`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch insights');
    const result: ApiResponse<any[]> = await res.json();
    return result.data || [];
  },

  async getChannelMetrics(): Promise<any> {
    if (isDemoRoute()) {
      const { MOCK_ANALYTICS } = await import('./demo-data-expanded');
        return {
          LinkedIn: 340,
          Email: 280,
          Facebook: 210,
          Instagram: 180,
          TikTok: 120,
        };
    }

    const res = await fetch(`${API_BASE}/analytics/channels`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch channel metrics');
    const result: ApiResponse<any> = await res.json();
    return result.data || {};
  },

  async getRoi(): Promise<number> {
    if (isDemoRoute()) {
      const { MOCK_ANALYTICS } = await import('./demo-data-expanded');
      return MOCK_ANALYTICS.roi.currentMonth || 3.4;
    }

    const res = await fetch(`${API_BASE}/analytics/roi`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch ROI');
    const result: ApiResponse<number> = await res.json();
    return result.data || 0;
  },
};

// ============================================
// USAGE API
// ============================================

export const usageApi = {
  async getUsage(): Promise<UsageData> {
    if (isDemoRoute()) {
      const { MOCK_USAGE } = await import('./demo-data-expanded');
      return MOCK_USAGE;
    }

    const res = await fetch(`${API_BASE}/usage`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch usage data');
    const result: ApiResponse<UsageData> = await res.json();
    return result.data!;
  },

  async downloadReport(): Promise<Blob> {
    if (isDemoRoute()) {
      return new Blob(['Mock usage report'], { type: 'text/csv' });
    }

    const res = await fetch(`${API_BASE}/usage/report`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to download report');
    return await res.blob();
  },
};

// ============================================
// INTEGRATIONS API
// ============================================

export const integrationsApi = {
  async list(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/integrations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch integrations');
    const result: ApiResponse<any[]> = await res.json();
    return result.data || [];
  },

  async connect(type: string, credentials: any): Promise<any> {
    const res = await fetch(`${API_BASE}/integrations/${type}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error(`Failed to connect ${type}`);
    return await res.json();
  },

  async disconnect(type: string): Promise<void> {
    const res = await fetch(`${API_BASE}/integrations/${type}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Failed to disconnect ${type}`);
  },

  async testConnection(type: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/integrations/${type}/test`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    return res.ok;
  },
};

// ============================================
// HELPERS
// ============================================

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    ''
  );
}

/** Relative or absolute URL fetch with bearer token when present. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? {});
  const token = typeof window !== 'undefined' ? getToken() : '';
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

export function useApi() {
  return {
    leads: leadsApi,
    dashboard: dashboardApi,
    ai: aiApi,
    automation: automationApi,
    analytics: analyticsApi,
    usage: usageApi,
    integrations: integrationsApi,
  };
}

