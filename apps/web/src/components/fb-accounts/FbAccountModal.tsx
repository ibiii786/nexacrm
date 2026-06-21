import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { formatZonedDate, parseZonedDateInput } from '../../utils/dateUtils';
import { XIcon, Loader2Icon, CheckIcon } from 'lucide-react';

interface FbAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: any;
}

export function FbAccountModal({ isOpen, onClose, onSuccess, account }: FbAccountModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    linkedEmail: '',
    status: 'ACTIVE',
    creationDate: '',
    assignedTo: '',
    vaultNote: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/users').then(res => setUsers(res.data.data)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (account) {
      setFormData({
        displayName: account.displayName || '',
        linkedEmail: account.linkedEmail || '',
        status: account.status || 'ACTIVE',
        creationDate: account.creationDate ? formatZonedDate(account.creationDate, 'yyyy-MM-dd') : '',
        assignedTo: account.assignedTo || '',
        vaultNote: '', // Never populate vault note on edit
      });
    } else {
      setFormData({
        displayName: '',
        linkedEmail: '',
        status: 'ACTIVE',
        creationDate: '',
        assignedTo: '',
        vaultNote: '',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        displayName: formData.displayName,
        linkedEmail: formData.linkedEmail,
        status: formData.status,
        creationDate: parseZonedDateInput(formData.creationDate) || null,
        assignedTo: formData.assignedTo || null,
      };

      if (formData.vaultNote) {
        payload.vaultNote = formData.vaultNote;
      }

      if (account) {
        await api.put(`/fb-accounts/${account.id}`, payload);
        toast.success('Account updated successfully');
      } else {
        await api.post('/fb-accounts', payload);
        toast.success('Account created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {account ? 'Edit Facebook Account' : 'New Facebook Account'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6">
          <form id="fb-account-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name *</label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Linked Email</label>
              <input
                type="email"
                value={formData.linkedEmail}
                onChange={e => setFormData({ ...formData, linkedEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Creation Date</label>
                <input
                  type="date"
                  value={formData.creationDate}
                  onChange={e => setFormData({ ...formData, creationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned To</label>
              <select
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vault Note (Encrypted)</label>
              <textarea
                value={formData.vaultNote}
                onChange={e => setFormData({ ...formData, vaultNote: e.target.value })}
                placeholder={account && account.hasVaultNote ? "Leave blank to keep existing encrypted note" : "Enter sensitive proxy or login details here"}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none h-24"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="fb-account-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2Icon size={16} className="animate-spin" /> : <CheckIcon size={16} />}
            {account ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
