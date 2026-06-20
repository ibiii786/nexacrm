import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { XIcon, Loader2Icon, CheckIcon } from 'lucide-react';

interface PayrollPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  period?: any;
}

export function PayrollPeriodModal({ isOpen, onClose, onSuccess, period }: PayrollPeriodModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    netSalary: '',
    status: 'PAID',
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/payroll/employees').then(res => setEmployees(res.data.data)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (period) {
      setFormData({
        employeeId: period.employeeId || '',
        periodStart: period.periodStart ? new Date(period.periodStart).toISOString().split('T')[0] : '',
        periodEnd: period.periodEnd ? new Date(period.periodEnd).toISOString().split('T')[0] : '',
        netSalary: period.netSalary?.toString() || '',
        status: period.status || 'PAID',
      });
    } else {
      setFormData({
        employeeId: '',
        periodStart: '',
        periodEnd: '',
        netSalary: '',
        status: 'PAID',
      });
    }
  }, [period, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        periodStart: new Date(formData.periodStart).toISOString(),
        periodEnd: new Date(formData.periodEnd).toISOString(),
        netSalary: formData.netSalary ? parseFloat(formData.netSalary) : null,
      };

      if (period) {
        await api.put(`/payroll/periods/${period.id}`, payload);
        toast.success('Payroll record updated successfully');
      } else {
        await api.post('/payroll/periods', payload);
        toast.success('Payroll record created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save payroll record');
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
            {period ? 'Edit Payroll Record' : 'Generate Payroll Record'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6">
          <form id="period-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee *</label>
              <select
                required
                value={formData.employeeId}
                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              >
                <option value="" disabled>Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.periodStart}
                  onChange={e => setFormData({ ...formData, periodStart: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.periodEnd}
                  onChange={e => setFormData({ ...formData, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Net Salary</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.netSalary}
                  onChange={e => setFormData({ ...formData, netSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
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
            form="period-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2Icon size={16} className="animate-spin" /> : <CheckIcon size={16} />}
            {period ? 'Save Changes' : 'Generate Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
