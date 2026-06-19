import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserPermissionsModal({ isOpen, onClose, userId }: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permsRes, userRes] = await Promise.all([
        api.get('/permissions'),
        api.get(`/users/${userId}`)
      ]);
      setPermissions(permsRes.data.data);
      setUserPermissions(userRes.data.data.userPermissions || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermission) return toast.error('Select a permission');
    
    try {
      await api.post(`/users/${userId}/permissions`, {
        permissionId: selectedPermission,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success('Permission granted');
      setSelectedPermission('');
      setExpiresAt('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to grant permission');
    }
  };

  const handleRevoke = async (permissionId: string) => {
    try {
      await api.delete(`/users/${userId}/permissions/${permissionId}`);
      toast.success('Permission revoked');
      fetchData();
    } catch (err) {
      toast.error('Failed to revoke permission');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage User Permissions</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            &times;
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-6">
              
              <form onSubmit={handleGrant} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Grant New Permission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permission</label>
                    <select
                      value={selectedPermission}
                      onChange={(e) => setSelectedPermission(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">Select Permission</option>
                      {permissions.map(p => (
                        <option key={p.id} value={p.id}>{p.module} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expires At (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium">
                    Grant Permission
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">Currently Assigned Permissions</h3>
                {userPermissions.length === 0 ? (
                  <p className="text-sm text-slate-500">No direct permissions assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {userPermissions.map((up) => {
                      const isExpired = up.expiresAt && new Date(up.expiresAt) < new Date();
                      return (
                        <li key={up.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {up.permission.module} - {up.permission.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {up.expiresAt ? (
                                <span className={isExpired ? 'text-red-500 font-semibold' : 'text-orange-500'}>
                                  Expires: {new Date(up.expiresAt).toLocaleString()} {isExpired && '(Expired)'}
                                </span>
                              ) : (
                                <span className="text-green-600 dark:text-green-400">Permanent</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevoke(up.permissionId)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded bg-red-50 dark:bg-red-500/10"
                          >
                            Revoke
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
