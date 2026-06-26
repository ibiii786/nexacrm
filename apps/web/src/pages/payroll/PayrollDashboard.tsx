import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Users, DollarSign, Clock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// Assuming we might use recharts or similar, for now we will build a simple dashboard

export default function PayrollDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          title="Back to Dashboard"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Overview of your company's payroll metrics.</p>
        </div>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">PKR {stats.paidThisMonth.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">PKR {stats.pendingPayroll.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/payroll/employees" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-primary dark:hover:border-primary transition-all group block">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary mb-2">Employees</h3>
          <p className="text-slate-500 text-sm">Manage employee profiles and salaries.</p>
        </Link>
        <Link to="/payroll/periods" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-primary dark:hover:border-primary transition-all group block">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary mb-2">Payroll Periods</h3>
          <p className="text-slate-500 text-sm">Generate payslips and process salaries.</p>
        </Link>
        <Link to="/payroll/commissions" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-primary dark:hover:border-primary transition-all group block">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary mb-2">Commissions</h3>
          <p className="text-slate-500 text-sm">Manage employee commissions and bonuses.</p>
        </Link>
      </div>
    </div>
  );
}
