import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  status?: any;
}

export function StatusModal({ isOpen, onClose, onSuccess, status }: StatusModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6', // default blue
    icon: '',
    isDefault: false,
    position: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        color: status.color,
        icon: status.icon || '',
        isDefault: status.isDefault,
        position: status.position,
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        icon: '',
        isDefault: false,
        position: 0,
      });
    }
  }, [status, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        position: Number(formData.position)
      };

      if (status) {
        await api.put(`/statuses/${status.id}`, payload);
        toast.success('Status updated successfully');
      } else {
        await api.post('/statuses', payload);
        toast.success('Status created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {status ? 'Edit Status' : 'Create Status'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <XIcon size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="e.g. In Progress"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-10 p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Default Status (New Orders)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
