import { create } from 'zustand';
import { User } from '@nexacrm/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: Record<string, string> | null;
  setAuth: (user: User, accessToken: string, rememberMe?: boolean) => Promise<void>;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  fetchSettings: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  settings: null,

  setAuth: async (user, accessToken, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('token', accessToken);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', accessToken);
      localStorage.removeItem('token');
    }
    
    // Fetch settings before declaring the app ready
    try {
      const res = await api.get('/settings');
      set({ settings: res.data.data });
    } catch (error) {
      console.error('Failed to fetch settings', error);
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

  fetchSettings: async () => {
    try {
      const res = await api.get('/settings');
      set({ settings: res.data.data });
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  }
}));
