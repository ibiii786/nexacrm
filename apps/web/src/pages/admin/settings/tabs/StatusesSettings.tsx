import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { StatusModal } from './StatusModal';

export function StatusesSettings() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null as string | null, count: 0 });

  useEffect(() => {
    fetchStatuses();
  }, [showArchived]);

  const fetchStatuses = async () => {
    try {
      const res = await api.get(`/statuses?includeArchived=${showArchived}`);
      setStatuses(res.data.data);
    } catch (error) {
      toast.error('Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedStatus(null);
    setIsModalOpen(true);
  };

  const openEditModal = (status: any) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const confirmDelete = (status: any) => {
    setDeleteDialog({ open: true, id: status.id, count: status._count?.orders || 0 });
  };

  const deleteStatus = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/statuses/${deleteDialog.id}`);
      toast.success('Status archived');
      setDeleteDialog({ open: false, id: null, count: 0 });
      fetchStatuses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete status');
    }
  };

  const restoreStatus = async (id: string) => {
    try {
      await api.put(`/statuses/${id}`, { isArchived: false });
      toast.success('Status restored successfully');
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to restore status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order Statuses</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Show Archived</span>
          </label>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-sm font-medium">
            Add Status
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Color</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Name</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {statuses.map(status => (
              <tr key={status.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4">
                  <div 
                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700" 
                    style={{ backgroundColor: status.color }}
                  ></div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {status.name}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <button onClick={() => openEditModal(status)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  {status.isArchived ? (
                    <button onClick={() => restoreStatus(status.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Restore</button>
                  ) : (
                    <button onClick={() => confirmDelete(status)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Archive</button>
                  )}
                </td>
              </tr>
            ))}
            {statuses.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No statuses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Archive Status"
        message={`Are you sure you want to archive this status? There are ${deleteDialog.count} orders currently assigned to it. They will still be accessible, but you won't be able to select this status for new orders.`}
        onConfirm={deleteStatus}
        onCancel={() => setDeleteDialog({ open: false, id: null, count: 0 })}
      />

      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStatuses}
        status={selectedStatus}
      />
    </div>
  );
}
