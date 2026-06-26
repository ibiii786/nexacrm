import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api, API_URL } from '../../lib/api';
import { Layout } from '../layout/Layout';
import axios from 'axios';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, setLoading, clearAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // If we already have auth state in memory (e.g. navigating between routes), skip
      if (isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Step 1: Attempt to get a fresh access token via the HttpOnly refresh cookie.
        // This covers the hard-refresh case where the in-memory access token is gone.
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = refreshResponse.data.data;

        // Step 2: Fetch the current user with the new access token
        const meResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Step 3: Restore auth state
        if (mounted) {
          await Promise.all([
            useAuthStore.getState().fetchSettings(),
            useAuthStore.getState().fetchUserSettings()
          ]);
          useAuthStore.setState({
            accessToken,
            isAuthenticated: true,
            user: meResponse.data.data.user,
            isLoading: false,
          });
          // Persist new access token
          localStorage.setItem('token', accessToken);
        }
      } catch (error) {
        // Refresh failed — token expired or no session. Send to login.
        if (mounted) {
          clearAuth();
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, setLoading, clearAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout />;
}
