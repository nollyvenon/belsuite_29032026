'use client';

import { create } from 'zustand';

type WorkspaceModule = 'dashboard' | 'analytics' | 'marketing' | 'social' | 'video' | 'ugc' | 'billing' | 'ai' | 'admin';

interface WorkspaceState {
  rangeDays: number;
  spotlightModule: WorkspaceModule;
  selectedTenantId: string | null;
  setRangeDays: (days: number) => void;
  setSpotlightModule: (module: WorkspaceModule) => void;
  setSelectedTenantId: (tenantId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  rangeDays: 30,
  spotlightModule: 'analytics',
  selectedTenantId: null,
  setRangeDays: (days) => set({ rangeDays: days }),
  setSpotlightModule: (module) => set({ spotlightModule: module }),
  setSelectedTenantId: (tenantId) => set({ selectedTenantId: tenantId }),
}));