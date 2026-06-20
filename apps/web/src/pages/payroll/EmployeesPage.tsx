import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { EmployeeModal } from '../../components/payroll/EmployeeModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/payroll/employees');
        setEmployees(res.data.data);
      } catch (error) {
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const openCreateModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const fetchEmployeesList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/employees');
      setEmployees(res.data.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your workforce for payroll.</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
          Add Employee
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Base Salary</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No employees found. Add one to get started.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  onClick={() => openEditModal(emp)}
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{emp.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{emp.role || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">${Number(emp.baseSalary || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      emp.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmployeesList}
        employee={selectedEmployee}
      />
    </div>
  );
}
