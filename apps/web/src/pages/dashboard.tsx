import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Dashboard Placeholder</h1>
      <p className="text-slate-600 dark:text-slate-300">Welcome, {user?.name} ({user?.role})</p>
      
      <button 
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
