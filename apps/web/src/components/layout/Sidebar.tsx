import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Settings, 
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  CreditCard, // For Payroll (Module 9)
  Facebook,   // For FB Accounts (Module 10)
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';



  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Permissions', path: '/my-permissions', icon: ShieldCheck },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
  ];

  const adminNavItems = [
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
  ];

  const iamNavItems = [
    { name: 'Users', path: '/admin/users', icon: Users },
    ...(user?.role === 'SUPER_ADMIN' ? [{ name: 'Audit Log', path: '/admin/audit-log', icon: ShieldAlert }] : []),
  ];

  const optionalModules = [
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'FB Accounts', path: '/fb-accounts', icon: Facebook }
  ];

  const NavItem = ({ item }: { item: any }) => (
    <NavLink
      to={item.path}
      onClick={() => {
        // close sidebar on mobile when navigating
        if (window.innerWidth < 1024) onClose();
      }}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        } ${isCollapsed ? 'justify-center px-0' : ''}`
      }
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon size={20} className="flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo/Header */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={24} />
            {!isCollapsed && <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">NexaCRM</span>}
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 overflow-x-hidden">
          
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Core
              </div>
            )}
            <div className="space-y-1">
              {mainNavItems.map(item => <NavItem key={item.name} item={item} />)}
              {isAdmin && adminNavItems.map(item => <NavItem key={item.name} item={item} />)}
            </div>
          </div>

          {isAdmin && (
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Access Control
                </div>
              )}
              <div className="space-y-1">
                {iamNavItems.map(item => <NavItem key={item.name} item={item} />)}
              </div>
            </div>
          )}

          {optionalModules.length > 0 && (
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Modules
                </div>
              )}
              <div className="space-y-1">
                {optionalModules.map(item => <NavItem key={item.name} item={item} />)}
              </div>
            </div>
          )}

        </nav>

        {/* Bottom Section (Settings for Admin & Collapse Toggle) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <NavLink
            to="/settings"
            title={isCollapsed ? 'Settings' : undefined}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Settings size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
          </NavLink>
          
          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center gap-3 px-3 py-2 w-full rounded-md transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
