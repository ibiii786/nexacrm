import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ShieldAlert, Search } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);
      params.append('page', page.toString());
      params.append('limit', '50');

      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="text-primary" size={32} />
            System Audit Log
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View system-wide critical actions and security events.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action</label>
            <input 
              type="text" 
              placeholder="e.g. LOGIN, DELETE_USER" 
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Entity</label>
            <input 
              type="text" 
              placeholder="e.g. User, Policy" 
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <button 
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 font-medium transition-colors"
          >
            <Search size={18} />
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Entity</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No logs found matching criteria.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {log.entity} {log.entityId ? `(#${log.entityId.substring(0,8)})` : ''}
                  </td>
                  <td className="px-6 py-4">
                    {log.actor ? (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{log.actor.name}</div>
                        <div className="text-xs text-slate-500">{log.actor.email}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <pre className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded overflow-x-auto max-w-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {logs.length === 50 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
