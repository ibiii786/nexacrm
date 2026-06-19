import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import UsersPage from './pages/admin/iam/UsersPage';
import GroupsPage from './pages/admin/iam/GroupsPage';
import PoliciesPage from './pages/admin/iam/PoliciesPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import SettingsPage from './pages/admin/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import EmployeesPage from './pages/payroll/EmployeesPage';
import PayrollPeriodsPage from './pages/payroll/PayrollPeriodsPage';
import AdvancesPage from './pages/payroll/AdvancesPage';
import FbAccountsPage from './pages/fb-accounts/FbAccountsPage';
import FbAccountDetail from './pages/fb-accounts/FbAccountDetail';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Orders Routes */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        
        {/* Admin IAM Routes */}
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/groups" element={<GroupsPage />} />
        <Route path="/admin/policies" element={<PoliciesPage />} />

        {/* User & System Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Payroll Routes */}
        <Route path="/payroll" element={<PayrollDashboard />} />
        <Route path="/payroll/employees" element={<EmployeesPage />} />
        <Route path="/payroll/periods" element={<PayrollPeriodsPage />} />
        <Route path="/payroll/advances" element={<AdvancesPage />} />

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
