'use client';

import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setSession: (accessToken: string, refreshToken?: string | null) => void;
  clearSession: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  setSession: (accessToken, refreshToken = null) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        window.localStorage.setItem('refreshToken', refreshToken);
      }
    }

    set({ accessToken, refreshToken, hydrated: true });
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('organizationId');
      window.localStorage.removeItem('token');
    }

    set({ accessToken: null, refreshToken: null, hydrated: true });
  },
  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ hydrated: true });
      return;
    }

    set({
      accessToken: window.localStorage.getItem('accessToken'),
      refreshToken: window.localStorage.getItem('refreshToken'),
      hydrated: true,
    });
  },
}));