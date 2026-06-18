import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { PlusIcon, TrashIcon } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groups</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage IAM groups and memberships.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          <PlusIcon size={16} />
          <span>Create Group</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Members</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{group.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group.description || '-'}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group._count?.members || 0}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteGroup(group.id)}
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
