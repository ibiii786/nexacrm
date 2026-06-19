import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';

interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  field?: any;
}

export function FieldModal({ isOpen, onClose, onSuccess, field }: FieldModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'TEXT',
    isRequired: false,
    isVisible: true,
    isGlobal: true,
    position: 0,
    options: '', // comma separated for enum
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (field) {
      setFormData({
        name: field.name,
        label: field.label,
        type: field.type,
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        isGlobal: field.isGlobal,
        position: field.position,
        options: field.options ? field.options.join(', ') : '',
      });
    } else {
      setFormData({
        name: '',
        label: '',
        type: 'TEXT',
        isRequired: false,
        isVisible: true,
        isGlobal: true,
        position: 0,
        options: '',
      });
    }
  }, [field, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        options: formData.type === 'ENUM' ? formData.options.split(',').map(o => o.trim()).filter(Boolean) : [],
        position: Number(formData.position)
      };

      if (field) {
        await api.put(`/fields/${field.id}`, payload);
        toast.success('Field updated successfully');
      } else {
        await api.post('/fields', payload);
        toast.success('Field created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save field');
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
            {field ? 'Edit Custom Field' : 'Create Custom Field'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <XIcon size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Field Key (Internal Name) *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="e.g. customer_age"
              disabled={!!field} // Cannot change key after creation
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Label *
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="e.g. Customer Age"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Field Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={!!field}
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DATE">Date</option>
                <option value="ENUM">Dropdown (Enum)</option>
                <option value="BOOLEAN">Checkbox</option>
              </select>
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

          {formData.type === 'ENUM' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dropdown Options (Comma separated)
              </label>
              <input
                type="text"
                required
                value={formData.options}
                onChange={e => setFormData({ ...formData, options: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Required Field</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isGlobal}
                onChange={e => setFormData({ ...formData, isGlobal: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Global (Appears on all statuses)</span>
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
              {isSubmitting ? 'Saving...' : 'Save Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
