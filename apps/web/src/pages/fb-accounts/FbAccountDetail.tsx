import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Lock, Unlock, Eye, X } from 'lucide-react';

export default function FbAccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Vault state
  const [vaultNote, setVaultNote] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [password, setPassword] = useState('');
  const [revealing, setRevealing] = useState(false);

  // Status Update state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await api.get(`/fb-accounts/${id}`);
        setAccount(res.data.data);
        setNewStatus(res.data.data.status);
      } catch (error) {
        toast.error('Failed to load FB account details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAccount();
  }, [id]);

  const handleRevealVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Password is required');
      return;
    }
    setRevealing(true);
    try {
      const res = await api.post(`/fb-accounts/${id}/reveal`, { password });
      setVaultNote(res.data.data.vaultNote);
      setIsRevealed(true);
      toast.success('Vault unlocked');
      setPassword(''); // clear immediately
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unlock vault');
    } finally {
      setRevealing(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReason) {
      toast.error('Reason is required');
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/fb-accounts/${id}`, {
        status: newStatus,
        statusChangeReason: statusReason
      });
      setAccount(res.data.data);
      toast.success('Status updated successfully');
      setIsStatusModalOpen(false);
      setStatusReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!account) return <div>Account not found</div>;

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{account.displayName}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Status: {account.status}</p>
        </div>
        <button 
          onClick={() => setIsStatusModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Update Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Account Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Linked Email</p>
                <p className="font-medium text-slate-900 dark:text-white">{account.linkedEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Creation Date</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {account.creationDate ? new Date(account.creationDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Assigned To</p>
                <p className="font-medium text-slate-900 dark:text-white">{account.assignee?.name || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Status History</h2>
            <div className="space-y-4">
              {account.statusLogs?.map((log: any) => (
                <div key={log.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{log.newStatus}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.changedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {log.reason || 'No reason provided'} by {log.changer?.name || 'System'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
            {isRevealed ? <Unlock size={20} /> : <Lock size={20} />}
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Secure Vault</h2>
          </div>
          
          <div className="flex-1">
            {!account.hasVaultNote ? (
              <p className="text-slate-500 text-sm">No vault note saved for this account.</p>
            ) : isRevealed ? (
              <div className="bg-slate-50 dark:bg-slate-800 rounded p-4 border border-slate-200 dark:border-slate-700">
                <pre className="text-sm whitespace-pre-wrap font-mono text-slate-800 dark:text-slate-200">
                  {vaultNote}
                </pre>
                <button 
                  onClick={() => setIsRevealed(false)}
                  className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Lock Vault Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleRevealVault} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This note is AES-256 encrypted. Please enter your account password to decrypt and view the contents.
                </p>
                <div>
                  <input
                    type="password"
                    placeholder="Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={revealing || !password}
                  className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Eye size={16} />
                  {revealing ? 'Decrypting...' : 'Reveal Vault Note'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Update Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form id="status-form" onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="BANNED">Banned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason *</label>
                  <textarea
                    required
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Why is this status being changed?"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none h-24"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="status-form"
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                {updatingStatus ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
