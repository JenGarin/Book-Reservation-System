import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Users, 
  BarChart3, 
  History, 
  UserCircle,
  LogOut,
  Dribbble,
  CreditCard,
  Moon,
  Sun,
  Bell,
  Receipt,
  ClipboardList,
  ListChecks
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  role: 'admin' | 'staff' | 'coach' | 'player';
}

export function Sidebar({ currentView, onViewChange, role }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { notifications, currentUser, logout, bookings } = useApp();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
    setIsLogoutConfirmOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'coach', 'player'] },
    { id: 'requests', label: 'Requests', icon: ListChecks, roles: ['admin', 'staff'] },
    { id: 'booking', label: 'Book a Court', icon: Calendar, roles: ['admin', 'staff', 'coach', 'player'] },
    { id: 'my-bookings', label: 'My Reservation', icon: History, roles: ['player', 'coach'] },
    { id: 'coach-sessions', label: 'My Sessions', icon: ClipboardList, roles: ['coach'] },
    { id: 'court-mgmt', label: 'Courts', icon: Dribbble, roles: ['admin', 'staff'] },
    { id: 'users', label: 'Players', icon: Users, roles: ['admin', 'staff'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'staff', 'coach', 'player'] },
    { id: 'profile', label: 'Profile', icon: UserCircle, roles: ['admin', 'staff', 'coach', 'player'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    { id: 'billing', label: 'Billing', icon: Receipt, roles: ['player', 'coach'] },
    { id: 'pricing', label: 'Pricing', icon: CreditCard, roles: ['admin', 'staff', 'coach', 'player'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-50 border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 transition-colors duration-300 overflow-hidden">
      <div className="p-6 flex items-center justify-center">
        <img src="/ventra-logo.png" alt="Ventra" className="h-24 w-auto" />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          if (item.id === 'notifications') {
            return (
              <button
                key={item.id}
                onClick={() => onViewChange('notifications')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
                )}
              >
                <Icon size={20} />
                {item.label}
                {unreadCount > 0 && (
                  <span className="absolute right-3 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                isActive 
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
              )}
            >
              <Icon size={20} />
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute right-3 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {unreadCount}
                </span>
              )}
              {item.id === 'requests' && pendingCount > 0 && (
                <span className="absolute right-3 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0 bg-gray-50">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold">
            {role.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sign Out</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
