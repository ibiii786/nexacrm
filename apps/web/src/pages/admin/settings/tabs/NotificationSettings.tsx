import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../../stores/authStore';

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifyOrderStatusChanged: true,
    emailNotifyOrderAssigned: true,
    emailNotifyAccountModified: true,
    emailNotifyAnnouncementPosted: true,
    emailNotifyPermissionExpiring: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const data = res.data.data;
        setSettings({
          emailNotifyOrderStatusChanged: data.emailNotifyOrderStatusChanged === 'true',
          emailNotifyOrderAssigned: data.emailNotifyOrderAssigned === 'true',
          emailNotifyAccountModified: data.emailNotifyAccountModified === 'true',
          emailNotifyAnnouncementPosted: data.emailNotifyAnnouncementPosted === 'true',
          emailNotifyPermissionExpiring: data.emailNotifyPermissionExpiring === 'true',
        });
      } catch (error) {
        toast.error('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await api.put('/settings', { [key]: newValue ? 'true' : 'false' });
      await useAuthStore.getState().fetchSettings();
      toast.success('Notification preference saved');
    } catch (error) {
      // Revert on failure
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to save preference');
    }
  };

  if (loading) return <div>Loading...</div>;

  const notifications = [
    { key: 'emailNotifyOrderStatusChanged', label: 'Order Status Changed', desc: 'Email when an order status is updated' },
    { key: 'emailNotifyOrderAssigned', label: 'Order Assigned', desc: 'Email when an order is assigned to a user' },
    { key: 'emailNotifyAccountModified', label: 'FB Account Modified', desc: 'Email when an FB account status changes' },
    { key: 'emailNotifyAnnouncementPosted', label: 'New Announcement', desc: 'Email when a new global announcement is posted' },
    { key: 'emailNotifyPermissionExpiring', label: 'Permission Expiring', desc: 'Email when a temporary permission is expiring soon' },
  ] as const;

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Email Notifications</h2>
      
      <div className="space-y-6">
        {notifications.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[key]}
                onChange={() => handleToggle(key)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
