import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import UsersPage from './pages/admin/iam/UsersPage';
import GroupsPage from './pages/admin/iam/GroupsPage';
import PoliciesPage from './pages/admin/iam/PoliciesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Admin IAM Routes */}
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/groups" element={<GroupsPage />} />
        <Route path="/admin/policies" element={<PoliciesPage />} />

        {/* Default redirect for authenticated users */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
