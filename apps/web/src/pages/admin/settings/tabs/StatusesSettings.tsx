import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export function StatusesSettings() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/statuses');
        setStatuses(res.data.data);
      } catch (error) {
        toast.error('Failed to load statuses');
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order Statuses</h2>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-sm font-medium">
          Add Status
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Color</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">Name</th>
              <th className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {statuses.map(status => (
              <tr key={status.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4">
                  <div 
                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700" 
                    style={{ backgroundColor: status.color }}
                  ></div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {status.name}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Archive</button>
                </td>
              </tr>
            ))}
            {statuses.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No statuses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
