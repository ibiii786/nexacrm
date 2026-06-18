import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ShieldAlert, UsersRound, LogOut, Briefcase } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back, {user?.name}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/orders" className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Orders</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage the entire production pipeline.</p>
          </Link>

          <Link to="/admin/users" className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Users</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage user accounts and access.</p>
          </Link>
          
          <Link to="/admin/groups" className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UsersRound size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Groups</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Organize users into permission groups.</p>
          </Link>
          
          <Link to="/admin/policies" className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Policies</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Define granular IAM access policies.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
