import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RequirePermissionProps {
  permissions: string[];
  children: React.ReactNode;
}

export function RequirePermission({ permissions, children }: RequirePermissionProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return null; // Let ProtectedRoute handle loading state
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SUPER_ADMIN has access to everything
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Check if user has all required permissions
  const effectivePermissions = (user as any).effectivePermissions || [];
  const hasAllPermissions = permissions.every(permission => 
    effectivePermissions.includes(permission)
  );

  if (!hasAllPermissions) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center">
        <div className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You do not have the required permissions to view this page.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
