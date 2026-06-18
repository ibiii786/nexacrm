import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { PlusIcon, TrashIcon } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data } = await api.get('/policies');
      setPolicies(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const deletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.delete(`/policies/${id}`);
      fetchPolicies();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Policies</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage IAM policies and permissions.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          <PlusIcon size={16} />
          <span>Create Policy</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Permissions</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{policy.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{policy.description || '-'}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{policy.permissions?.length || 0} attached</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deletePolicy(policy.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
