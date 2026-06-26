export function NotificationSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Notification Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Email notifications have been disabled for this deployment.
        </p>
      </div>
    </div>
  );
}
