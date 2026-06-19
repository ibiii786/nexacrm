import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { UsersIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { GroupModal } from './GroupModal';
import toast from 'react-hot-toast';

function GroupDetailPanel({ group, allPermissions, allUsers, onUpdate }: any) {
  const [newUserId, setNewUserId] = useState('');
  const [newPermId, setNewPermId] = useState('');

  const addMember = async () => {
    if (!newUserId) return;
    try {
      await api.post(`/groups/${group.id}/members`, { userId: newUserId });
      toast.success('Member added');
      setNewUserId('');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await api.delete(`/groups/${group.id}/members/${userId}`);
      toast.success('Member removed');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const attachPermission = async () => {
    if (!newPermId) return;
    try {
      await api.post(`/groups/${group.id}/permissions`, { permissionId: newPermId });
      toast.success('Permission attached');
      setNewPermId('');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to attach permission');
    }
  };

  const detachPermission = async (permissionId: string) => {
    try {
      await api.delete(`/groups/${group.id}/permissions/${permissionId}`);
      toast.success('Permission removed');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove permission');
    }
  };

  return (
    <tr>
      <td colSpan={4} className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Members */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
              <UsersIcon size={14} /> Members ({group._count?.members || 0})
            </h4>
            <div className="space-y-1 mb-3">
              {(group.members || []).map((m: any) => (
                <div key={m.user?.id || m.userId} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">{m.user?.name || m.userId}</span>
                  <button onClick={() => removeMember(m.user?.id || m.userId)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                </div>
              ))}
              {(group.members || []).length === 0 && <p className="text-xs text-slate-400">No members</p>}
            </div>
            <div className="flex gap-2">
              <select
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white"
              >
                <option value="">Select user...</option>
                {allUsers.filter((u: any) => !(group.members || []).some((m: any) => (m.user?.id || m.userId) === u.id)).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <button onClick={addMember} disabled={!newUserId} className="text-sm bg-primary text-white px-3 py-1 rounded disabled:opacity-40 hover:bg-primary/90">
                Add
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
              Permissions ({(group.permissions || []).length})
            </h4>
            <div className="space-y-1 mb-3">
              {(group.permissions || []).map((gp: any) => (
                <div key={gp.permission?.id || gp.permissionId} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{gp.permission?.name || gp.permissionId}</span>
                  <button onClick={() => detachPermission(gp.permission?.id || gp.permissionId)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                </div>
              ))}
              {(group.permissions || []).length === 0 && <p className="text-xs text-slate-400">No permissions assigned</p>}
            </div>
            <div className="flex gap-2">
              <select
                value={newPermId}
                onChange={(e) => setNewPermId(e.target.value)}
                className="flex-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white"
              >
                <option value="">Select permission...</option>
                {allPermissions.filter((p: any) => !(group.permissions || []).some((gp: any) => (gp.permission?.id || gp.permissionId) === p.id)).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.module}: {p.name}</option>
                ))}
              </select>
              <button onClick={attachPermission} disabled={!newPermId} className="text-sm bg-primary text-white px-3 py-1 rounded disabled:opacity-40 hover:bg-primary/90">
                Add
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.data);
    } catch (error) {
      toast.error('Failed to load groups');
    }
  };

  const fetchGroupDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data.data } : g));
    } catch (err) {
      toast.error('Failed to load group details');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setAllUsers(data.data);
    } catch (err) {}
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/permissions');
      setAllPermissions(data.data);
    } catch (err) {}
  };

  const toggleExpand = async (id: string) => {
    if (expandedGroupId === id) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(id);
      await fetchGroupDetail(id);
    }
  };

  const confirmDeleteGroup = (id: string) => {
    setDeleteDialog({ open: true, id: id });
  };

  const deleteGroup = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/groups/${deleteDialog.id}`);
      toast.success('Group deleted');
      setDeleteDialog({ open: false, id: null });
      if (expandedGroupId === deleteDialog.id) setExpandedGroupId(null);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groups</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage IAM groups, memberships, and group permissions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          <PlusIcon size={16} />
          <span>Create Group</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Members</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {groups.map((group) => (
              <>
                <tr key={group.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{group.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group._count?.members ?? 0}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                    <button
                      onClick={() => toggleExpand(group.id)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      title="Manage Members & Permissions">
                      {expandedGroupId === group.id ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                    </button>
                    <button
                      onClick={() => confirmDeleteGroup(group.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      title="Delete Group">
                      <TrashIcon size={18} />
                    </button>
                  </td>
                </tr>
                {expandedGroupId === group.id && (
                  <GroupDetailPanel
                    key={`detail-${group.id}`}
                    group={group}
                    allUsers={allUsers}
                    allPermissions={allPermissions}
                    onUpdate={() => fetchGroupDetail(group.id)}
                  />
                )}
              </>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No groups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        onConfirm={deleteGroup}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGroups}
      />
    </div>
  );
}
