import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { GeneralSettings } from './tabs/GeneralSettings';
import { FieldsSettings } from './tabs/FieldsSettings';
import { StatusesSettings } from './tabs/StatusesSettings';
import { ModuleToggles } from './tabs/ModuleToggles';
import { AppearanceSettings } from './tabs/AppearanceSettings';
import { NotificationSettings } from './tabs/NotificationSettings';
import { Settings, CheckSquare, Palette, List, ToggleRight, Bell } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const hasSettingsAccess = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || (user as any)?.effectivePermissions?.includes('settings:access');

  const [activeTab, setActiveTab] = useState(hasSettingsAccess ? 'general' : 'appearance');

  const tabs = [
    ...(hasSettingsAccess ? [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'fields', label: 'Custom Fields', icon: CheckSquare },
      { id: 'statuses', label: 'Statuses', icon: List },
      { id: 'modules', label: 'Modules', icon: ToggleRight },
    ] : []),
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage system configurations and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'fields' && <FieldsSettings />}
            {activeTab === 'statuses' && <StatusesSettings />}
            { activeTab === 'modules' && <ModuleToggles />}
            { activeTab === 'appearance' && <AppearanceSettings />}
            { activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
