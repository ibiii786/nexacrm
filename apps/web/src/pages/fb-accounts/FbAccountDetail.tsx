import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Lock, Unlock, Eye } from 'lucide-react';

export default function FbAccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Vault state
  const [vaultNote, setVaultNote] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [password, setPassword] = useState('');
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await api.get(`/fb-accounts/${id}`);
        setAccount(res.data.data);
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

  if (loading) return <div>Loading...</div>;
  if (!account) return <div>Account not found</div>;

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{account.displayName}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Status: {account.status}</p>
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
    </div>
  );
}
