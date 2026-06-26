import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { formatZonedDate, parseZonedDateInput, getZonedToday } from '../../utils/dateUtils';
import { Plus, Edit2, Trash2, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<any>(null);
  const navigate = useNavigate();

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');

  const fetchCommissions = async () => {
    try {
      const res = await api.get('/payroll/commissions');
      setCommissions(res.data.data);
    } catch (error) {
      toast.error('Failed to load commissions');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/payroll/employees');
      setEmployees(res.data.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  useEffect(() => {
    Promise.all([fetchCommissions(), fetchEmployees()]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId,
        amount: Number(amount),
        reason,
        date: parseZonedDateInput(date) || getZonedToday().toISOString()
      };

      if (editingCommission) {
        await api.put(`/payroll/commissions/${editingCommission.id}`, payload);
        toast.success('Commission updated successfully');
      } else {
        await api.post('/payroll/commissions', payload);
        toast.success('Commission created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchCommissions();
    } catch (error) {
      toast.error('Failed to save commission');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission?')) return;
    try {
      await api.delete(`/payroll/commissions/${id}`);
      toast.success('Commission deleted successfully');
      fetchCommissions();
    } catch (error) {
      toast.error('Failed to delete commission');
    }
  };

  const openEditModal = (commission: any) => {
    setEditingCommission(commission);
    setEmployeeId(commission.employeeId);
    setAmount(commission.amount.toString());
    setReason(commission.reason || '');
    setDate(formatZonedDate(commission.date, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCommission(null);
    setEmployeeId('');
    setAmount('');
    setReason('');
    setDate(formatZonedDate(getZonedToday(), 'yyyy-MM-dd'));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payroll')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
            title="Back to Payroll Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Commissions</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage salary commissions for employees.</p>
          </div>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          New Commission
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Reason</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {commissions.map(commission => (
              <tr key={commission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{commission.employee?.name}</div>
                  <div className="text-sm text-slate-500">{commission.employee?.role}</div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {formatZonedDate(commission.date)}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  ${commission.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {commission.reason}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditModal(commission)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(commission.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No commissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xl w-full max-w-md z-50 border border-slate-200 dark:border-slate-800">
            <Dialog.Title className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingCommission ? 'Edit Commission' : 'New Commission'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
                <select 
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                <input 
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <textarea 
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white resize-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                >
                  {editingCommission ? 'Save Changes' : 'Create Commission'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
