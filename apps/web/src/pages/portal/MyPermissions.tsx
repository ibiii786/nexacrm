import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { ShieldCheckIcon, ClockIcon } from 'lucide-react';

export default function MyPermissions() {
  const user = useAuthStore(state => state.user);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchPermissions();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPermissions = async () => {
    try {
      if (!user) return;
      const res = await api.get(`/users/${user.id}`);
      setPermissions(res.data.data.userPermissions || []);
    } catch (err) {
      toast.error('Failed to load your permissions');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format countdown timer
  const formatTimeLeft = (expiresAt: string) => {
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now.getTime();
    
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  if (loading) return <div className="p-8">Loading permissions...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="text-primary" />
            My Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View the access permissions currently assigned to your account.
          </p>
        </div>
      </div>

      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg mb-6 flex items-start gap-3 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
          <ShieldCheckIcon className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-sm">Super Administrator Access</h3>
            <p className="text-sm mt-1">
              You are a System Administrator. You inherently have full access to all system functions regardless of direct permissions listed below.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {permissions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p>You have no direct permissions assigned to your account.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Module
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Permission
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status / Time Left
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {permissions.map((up) => {
                const isExpired = up.expiresAt && new Date(up.expiresAt) < now;
                
                return (
                  <tr key={up.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {up.permission.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-mono">
                      {up.permission.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {up.expiresAt ? (
                        <div className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500 font-semibold' : 'text-orange-500 font-medium font-mono'}`}>
                          <ClockIcon size={16} />
                          {formatTimeLeft(up.expiresAt)}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Permanent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
