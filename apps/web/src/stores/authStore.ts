import { create } from 'zustand';
import { User } from '../shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: Record<string, string> | null;
  userSettings: Record<string, string> | null;
  setAuth: (user: User, accessToken: string, rememberMe?: boolean) => Promise<void>;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  fetchSettings: () => Promise<void>;
  fetchUserSettings: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  settings: null,
  userSettings: null,

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
      const [settingsRes, userSettingsRes] = await Promise.all([
        api.get('/settings'),
        api.get('/user-settings').catch(() => ({ data: { data: {} } }))
      ]);
      set({ 
        settings: settingsRes.data.data,
        userSettings: userSettingsRes.data.data 
      });
      
      const appearance = userSettingsRes.data.data.appearance || 'light';
      if (appearance === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      
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
      userSettings: null,
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
  },

  fetchUserSettings: async () => {
    try {
      const res = await api.get('/user-settings');
      set({ userSettings: res.data.data });
      
      const appearance = res.data.data.appearance || 'light';
      if (appearance === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (error) {
      console.error('Failed to fetch user settings', error);
    }
  }
}));
