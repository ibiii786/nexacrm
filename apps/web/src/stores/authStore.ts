import { create } from 'zustand';
import { User } from '@nexacrm/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: Record<string, string> | null;
  setAuth: (user: User, accessToken: string, rememberMe?: boolean) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  loadUser: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  settings: null,

  setAuth: (user, accessToken, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('token', accessToken);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', accessToken);
      localStorage.removeItem('token');
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      settings: null,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  loadUser: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        set({ user: res.data.data, accessToken: token, isAuthenticated: true, isLoading: false });
        get().fetchSettings();
      } catch (error) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      const res = await api.get('/settings');
      set({ settings: res.data.data });
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  }
}));
