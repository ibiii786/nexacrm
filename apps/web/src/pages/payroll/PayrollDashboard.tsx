import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Users, DollarSign, Clock } from 'lucide-react';
// Assuming we might use recharts or similar, for now we will build a simple dashboard

export default function PayrollDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/payroll/dashboard');
        setStats(res.data.data);
      } catch (error) {
        toast.error('Failed to load payroll stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Overview of your company's payroll metrics.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Employees</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.paidThisMonth.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Payroll</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.pendingPayroll.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Further charts or detailed views could go here */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500">More detailed charts to be implemented here (e.g. Month-over-Month expenses).</p>
      </div>
    </div>
  );
}
