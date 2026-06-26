import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RequirePermission } from './components/auth/RequirePermission';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/login';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/dashboard';
import UsersPage from './pages/admin/iam/UsersPage';
import MyPermissions from './pages/portal/MyPermissions';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import SettingsPage from './pages/admin/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import EmployeesPage from './pages/payroll/EmployeesPage';
import PayrollPeriodsPage from './pages/payroll/PayrollPeriodsPage';
import CommissionsPage from './pages/payroll/CommissionsPage';
import FbAccountsPage from './pages/fb-accounts/FbAccountsPage';
import FbAccountDetail from './pages/fb-accounts/FbAccountDetail';
import AuditLogPage from './pages/admin/AuditLogPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';

function App() {

  const theme = useAuthStore(state => state.settings?.theme) || 'light';
  const sessionTimeoutMinutes = parseInt(useAuthStore(state => state.settings?.sessionTimeoutMinutes) || '30', 10);
  const clearAuth = useAuthStore(state => state.clearAuth);
  
  // Apply theme on load or change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply primary color
  const primaryColor = useAuthStore(state => state.settings?.primaryColor) || '#4f46e5'; // Default indigo-600
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
  }, [primaryColor]);

  // Handle Session Timeout (Idle detection)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      // Timeout in milliseconds
      logoutTimerRef.current = setTimeout(() => {
        clearAuth();
        window.location.href = '/login?timeout=true';
      }, sessionTimeoutMinutes * 60 * 1000);
    };

    // Attach event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    // Initial setup
    resetTimer();

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [sessionTimeoutMinutes, clearAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Orders Routes */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        
        {/* Admin IAM Routes */}
        <Route path="/admin/users" element={<RequirePermission permissions={['users:view']}><UsersPage /></RequirePermission>} />
        <Route path="/admin/audit-log" element={<RequirePermission permissions={['audit:view']}><AuditLogPage /></RequirePermission>} />
        <Route path="/announcements" element={<AnnouncementsPage />} />

        {/* User & System Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-permissions" element={<MyPermissions />} />
        {/* Payroll Routes */}
        <Route path="/payroll" element={<PayrollDashboard />} />
        <Route path="/payroll/employees" element={<EmployeesPage />} />
        <Route path="/payroll/periods" element={<PayrollPeriodsPage />} />
        <Route path="/payroll/commissions" element={<CommissionsPage />} />

        {/* FB Accounts Routes */}
        <Route path="/fb-accounts" element={<FbAccountsPage />} />
        <Route path="/fb-accounts/:id" element={<FbAccountDetail />} />

        {/* Default redirect for authenticated users */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
