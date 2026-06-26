import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../../stores/authStore';

export function AppearanceSettings() {
  const [appearance, setAppearance] = useState('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/user-settings');
        setAppearance(res.data.data.appearance || 'light');
      } catch (error) {
        toast.error('Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAppearanceChange = async (newAppearance: string) => {
    setAppearance(newAppearance);
    try {
      await api.put('/user-settings', { appearance: newAppearance });
      await useAuthStore.getState().fetchUserSettings();
      toast.success('Appearance preference saved');
      
      // Update HTML class
      if (newAppearance === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      toast.error('Failed to update appearance');
    }
  };



  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Appearance</h2>
      
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Appearance Preference</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => handleAppearanceChange('light')}
            className={`border-2 rounded-lg p-4 text-center transition-colors ${appearance === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <div className="w-full h-20 bg-slate-100 rounded-md mb-2 border border-slate-200 flex flex-col overflow-hidden">
              <div className="h-4 bg-white border-b border-slate-200"></div>
              <div className="flex-1 flex">
                <div className="w-1/4 bg-slate-50 border-r border-slate-200"></div>
                <div className="w-3/4 bg-white"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Light Mode</span>
          </button>

          <button 
            onClick={() => handleAppearanceChange('dark')}
            className={`border-2 rounded-lg p-4 text-center transition-colors ${appearance === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <div className="w-full h-20 bg-slate-900 rounded-md mb-2 border border-slate-800 flex flex-col overflow-hidden">
              <div className="h-4 bg-slate-950 border-b border-slate-800"></div>
              <div className="flex-1 flex">
                <div className="w-1/4 bg-slate-900 border-r border-slate-800"></div>
                <div className="w-3/4 bg-slate-950"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Dark Mode</span>
          </button>
        </div>
      </div>


    </div>
  );
}
