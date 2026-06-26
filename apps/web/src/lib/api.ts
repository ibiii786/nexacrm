import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// @ts-ignore
export const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies (refresh token)
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken || localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops if the refresh endpoint itself fails
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;

        // After successful refresh, just update the token:
        useAuthStore.setState({ accessToken });
        localStorage.setItem('token', accessToken);

        // Update the original request's authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. refresh token expired or revoked), clear auth
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
