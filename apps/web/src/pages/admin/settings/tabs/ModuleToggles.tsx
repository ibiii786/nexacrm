import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { Switch } from '../../../../components/ui/switch'; // Assuming shadcn switch
import { useAuthStore } from '../../../../stores/authStore';

export function ModuleToggles() {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState({
    isPayrollEnabled: false,
    isFbAccountsEnabled: false,
  });
  const fetchSettings = useAuthStore(state => state.fetchSettings);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/settings');
        setModules({
          isPayrollEnabled: res.data.data.isPayrollEnabled === 'true',
          isFbAccountsEnabled: res.data.data.isFbAccountsEnabled === 'true',
        });
      } catch (error) {
        toast.error('Failed to load module settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, checked: boolean) => {
    const previousState = { ...modules };
    setModules(prev => ({ ...prev, [key]: checked }));
    
    try {
      await api.put('/settings', { [key]: checked.toString() });
      toast.success('Module setting updated. You may need to refresh to see sidebar changes.');
      await fetchSettings(); // This updates the global store instantly
    } catch (error) {
      setModules(previousState);
      toast.error('Failed to update module setting');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Module Toggles</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white">Payroll Module</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enable employee registry, salary slips, and payroll dashboards.
            </p>
          </div>
          <Switch 
            checked={modules.isPayrollEnabled}
            onCheckedChange={(checked: boolean) => handleToggle('isPayrollEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white">Facebook Accounts Vault</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enable encrypted storage and tracking of Facebook operational accounts.
            </p>
          </div>
          <Switch 
            checked={modules.isFbAccountsEnabled}
            onCheckedChange={(checked: boolean) => handleToggle('isFbAccountsEnabled', checked)}
          />
        </div>
      </div>
    </div>
  );
}
