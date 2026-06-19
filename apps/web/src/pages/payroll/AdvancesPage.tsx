import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<any>(null);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');

  const fetchAdvances = async () => {
    try {
      const res = await api.get('/payroll/advances');
      setAdvances(res.data.data);
    } catch (error) {
      toast.error('Failed to load advances');
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
    Promise.all([fetchAdvances(), fetchEmployees()]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId,
        amount: Number(amount),
        reason,
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      };

      if (editingAdvance) {
        await api.put(`/payroll/advances/${editingAdvance.id}`, payload);
        toast.success('Advance updated successfully');
      } else {
        await api.post('/payroll/advances', payload);
        toast.success('Advance created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchAdvances();
    } catch (error) {
      toast.error('Failed to save advance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advance?')) return;
    try {
      await api.delete(`/payroll/advances/${id}`);
      toast.success('Advance deleted successfully');
      fetchAdvances();
    } catch (error) {
      toast.error('Failed to delete advance');
    }
  };

  const openEditModal = (advance: any) => {
    setEditingAdvance(advance);
    setEmployeeId(advance.employeeId);
    setAmount(advance.amount.toString());
    setReason(advance.reason || '');
    setDate(new Date(advance.date).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingAdvance(null);
    setEmployeeId('');
    setAmount('');
    setReason('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Advances</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage salary advances for employees.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          New Advance
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
            {advances.map(advance => (
              <tr key={advance.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{advance.employee?.name}</div>
                  <div className="text-sm text-slate-500">{advance.employee?.role}</div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {new Date(advance.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  ${advance.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {advance.reason}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditModal(advance)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(advance.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {advances.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No advances found.
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
              {editingAdvance ? 'Edit Advance' : 'New Advance'}
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
                  {editingAdvance ? 'Save Changes' : 'Create Advance'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
