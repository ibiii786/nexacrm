import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { PlusIcon, TrashIcon, BanIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { UserModal } from './UserModal';
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteDialog({ open: true, userId: id });
  };

  const deleteUser = async () => {
    if (!deleteDialog.userId) return;
    try {
      await api.delete(`/users/${deleteDialog.userId}`);
      setDeleteDialog({ open: false, userId: null });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
    }
  };

  const suspendUser = async (id: string, isActive: boolean) => {
    try {
      await api.post(`/users/${id}/${isActive ? 'suspend' : 'unsuspend'}`);
      toast.success(isActive ? 'User suspended' : 'User unsuspended');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  if (isLoading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage users, roles, and access.</p>
        </div>
        <button 
          onClick={() => setIsUserModalOpen(true)}
          data-testid="iam-add-user"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <PlusIcon size={16} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => suspendUser(user.id, user.isActive)}
                    className={`transition-colors ${user.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'}`}
                    title={user.isActive ? 'Suspend User' : 'Unsuspend User'}
                  >
                    <BanIcon size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(user.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    title="Delete User"
                  >
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={deleteUser}
        onCancel={() => setDeleteDialog({ open: false, userId: null })}
      />


      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
}
