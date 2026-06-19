import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { FieldModal } from './FieldModal';

export function FieldsSettings() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null as string | null });

  useEffect(() => {
    fetchFields();
  }, [showArchived]);

  const fetchFields = async () => {
    try {
      const res = await api.get(`/fields?includeArchived=${showArchived}`);
      setFields(res.data.data);
    } catch (error) {
      toast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedField(null);
    setIsModalOpen(true);
  };

  const openEditModal = (field: any) => {
    setSelectedField(field);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const deleteField = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/fields/${deleteDialog.id}`);
      toast.success('Field deleted');
      setDeleteDialog({ open: false, id: null });
      fetchFields();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete field');
    }
  };

  const restoreField = async (id: string) => {
    try {
      await api.put(`/fields/${id}`, { isArchived: false });
      toast.success('Field restored successfully');
      fetchFields();
    } catch (error) {
      toast.error('Failed to restore field');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Fields</h2>
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
            Add Field
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Name</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Type</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Required</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {fields.map(field => (
              <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {field.name}
                </td>
                <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  {field.type}
                </td>
                <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                  {field.isRequired ? 'Yes' : 'No'}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <button onClick={() => openEditModal(field)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  {field.isArchived ? (
                    <button onClick={() => restoreField(field.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Restore</button>
                  ) : (
                    <button onClick={() => confirmDelete(field.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Archive</button>
                  )}
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No custom fields found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Custom Field"
        message="Are you sure you want to delete this custom field? Note: This may affect orders using this field."
        onConfirm={deleteField}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      <FieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFields}
        field={selectedField}
      />
    </div>
  );
}
