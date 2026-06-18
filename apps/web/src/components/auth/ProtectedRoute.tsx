import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, setAuth, setLoading, clearAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          // Attempt to get user info (this will trigger silent refresh if needed)
          const response = await api.get('/auth/me');
          if (mounted) {
            // We don't have the token here directly, but the interceptor handles it
            // Let's just set isAuthenticated to true if the request succeeds
            // The access token is usually returned in the refresh, not the /me route, 
            // but our axios instance handles token updates transparently
            useAuthStore.setState({ 
              isAuthenticated: true, 
              user: response.data.data.user,
              isLoading: false 
            });
          }
        } catch (error) {
          if (mounted) {
            clearAuth();
          }
        }
      } else {
        if (mounted) {
          setLoading(false);
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

  return <Outlet />;
}
