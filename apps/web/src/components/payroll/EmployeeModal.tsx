import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { formatZonedDate, parseZonedDateInput } from '../../utils/dateUtils';
import { XIcon, Loader2Icon, CheckIcon } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: any;
}

export function EmployeeModal({ isOpen, onClose, onSuccess, employee }: EmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    joiningDate: '',
    baseSalary: '',
    currency: 'PKR',
    paymentSchedule: 'MONTHLY',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        joiningDate: employee.joiningDate ? formatZonedDate(employee.joiningDate, 'yyyy-MM-dd') : '',
        baseSalary: employee.baseSalary?.toString() || '',
        currency: employee.currency || 'PKR',
        paymentSchedule: employee.paymentSchedule || 'MONTHLY',
        isActive: employee.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        joiningDate: '',
        baseSalary: '',
        currency: 'PKR',
        paymentSchedule: 'MONTHLY',
        isActive: true,
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        joiningDate: parseZonedDateInput(formData.joiningDate) || null,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
      };

      if (employee) {
        await api.put(`/payroll/employees/${employee.id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/payroll/employees', payload);
        toast.success('Employee created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save employee');
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
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base Salary</label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="px-3 py-2 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                  >
                    <option value="PKR">PKR</option>
                    <option value="CAD">CAD</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-r-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Schedule</label>
                <select
                  value={formData.paymentSchedule}
                  onChange={e => setFormData({ ...formData, paymentSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Employee</span>
              </label>
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
            form="employee-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2Icon size={16} className="animate-spin" /> : <CheckIcon size={16} />}
            {employee ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
