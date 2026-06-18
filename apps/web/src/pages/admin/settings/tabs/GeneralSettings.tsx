import { useState, useEffect } from 'react';
// Let's use react-hook-form properly
// Let's use react-hook-form properly
import { useForm as useHookForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

const generalSettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required'),
  editWindowMinutes: z.string().regex(/^\d+$/, 'Must be a number'),
  sessionTimeoutMinutes: z.string().regex(/^\d+$/, 'Must be a number'),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useHookForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      timezone: 'UTC',
      language: 'en',
      editWindowMinutes: '30',
      sessionTimeoutMinutes: '30',
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        reset({
          timezone: res.data.data.timezone || 'UTC',
          language: res.data.data.language || 'en',
          editWindowMinutes: res.data.data.editWindowMinutes || '30',
          sessionTimeoutMinutes: res.data.data.sessionTimeoutMinutes || '30',
        });
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: GeneralSettingsValues) => {
    try {
      await api.put('/settings', data);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">General Settings</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Timezone
            </label>
            <select 
              {...register('timezone')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="UTC">UTC</option>
              <option value="America/Toronto">Eastern Time (ET)</option>
              <option value="America/Vancouver">Pacific Time (PT)</option>
              <option value="America/Edmonton">Mountain Time (MT)</option>
              <option value="America/Winnipeg">Central Time (CT)</option>
              <option value="America/Halifax">Atlantic Time (AT)</option>
              <option value="America/St_Johns">Newfoundland Time (NT)</option>
            </select>
            {errors.timezone && <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Language
            </label>
            <select 
              {...register('language')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="fr">French (Français)</option>
            </select>
            {errors.language && <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Edit Window (minutes)
            </label>
            <input 
              type="number" 
              {...register('editWindowMinutes')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">How long users can edit their own orders after creation.</p>
            {errors.editWindowMinutes && <p className="mt-1 text-sm text-red-600">{errors.editWindowMinutes.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Session Timeout (minutes)
            </label>
            <input 
              type="number" 
              {...register('sessionTimeoutMinutes')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">How long users can be idle before being logged out.</p>
            {errors.sessionTimeoutMinutes && <p className="mt-1 text-sm text-red-600">{errors.sessionTimeoutMinutes.message}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
