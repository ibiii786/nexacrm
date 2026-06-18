import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Menu, LogOut, User as UserIcon, Settings, Search } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        {/* Global Search trigger */}
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors w-64 text-left"
        >
          <Search size={16} />
          <span>Search (Cmd+K)</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown />
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        
        <div className="flex items-center gap-3 group relative cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-slate-900 dark:text-white leading-none">{user?.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
            {user?.name?.[0] || 'U'}
          </div>

          {/* Simple Dropdown on Hover */}
          <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <UserIcon size={16} /> Profile
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} /> Settings
                </button>
              )}
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </header>
  );
}
