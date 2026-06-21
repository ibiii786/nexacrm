import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayrollPeriodModal } from '../../components/payroll/PayrollPeriodModal';
import { formatZonedDate } from '../../utils/dateUtils';

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const navigate = useNavigate();

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/periods');
      setPeriods(res.data.data);
    } catch (error) {
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const openCreateModal = () => {
    setSelectedPeriod(null);
    setIsModalOpen(true);
  };

  const openEditModal = (period: any) => {
    setSelectedPeriod(period);
    setIsModalOpen(true);
  };

  const downloadPdf = async (periodId: string) => {
    try {
      const res = await api.get(`/payroll/periods/${periodId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_slip_${periodId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get(`/payroll/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_summary.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download Excel');
    }
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Periods</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage salary disbursements and generate slips.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={downloadExcel}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Download size={18} />
            Export Summary (Excel)
          </button>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Generate Payroll
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Period</th>
              <th className="px-6 py-4 font-medium">Net Salary</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {periods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No payroll periods found.
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{period.employee.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {formatZonedDate(period.periodStart)} - {formatZonedDate(period.periodEnd)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">
                    ${Number(period.netSalary || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      period.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {period.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(period); }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadPdf(period.id); }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PayrollPeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPeriods}
        period={selectedPeriod}
      />
    </div>
  );
}
