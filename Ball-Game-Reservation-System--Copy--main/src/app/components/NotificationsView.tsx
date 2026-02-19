import React from 'react';
import { useApp } from '@/context/AppContext';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Notification } from '@/types';

export function NotificationsView() {
  const { currentUser, notifications } = useApp();
  
  const myNotifications = notifications
    .filter((n: Notification) => n.userId === currentUser?.id)
    .sort((a: Notification, b: Notification) => b.createdAt.getTime() - a.createdAt.getTime());

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'error': return <XCircle className="w-6 h-6 text-rose-600" />;
      default: return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-100 text-emerald-900';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-900';
      case 'error': return 'bg-rose-50 border-rose-100 text-rose-900';
      default: return 'bg-blue-50 border-blue-100 text-blue-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400">Stay updated with your latest activities.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="font-bold text-slate-900 dark:text-white">{myNotifications.length}</span>
          <span className="text-slate-500 dark:text-slate-400 ml-2">Total</span>
        </div>
      </div>

      <div className="space-y-4">
        {myNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No notifications yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
              We'll notify you when your bookings are confirmed, cancelled, or when there are important updates.
            </p>
          </div>
        ) : (
          myNotifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className={`p-6 rounded-2xl border flex gap-4 transition-all hover:shadow-md ${getStyles(notification.type)}`}
            >
              <div className="shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-lg">{notification.title}</h3>
                  <span className="text-xs font-medium opacity-70 whitespace-nowrap">
                    {format(notification.createdAt, 'MMM dd, HH:mm')}
                  </span>
                </div>
                <p className="mt-1 opacity-90 leading-relaxed">{notification.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}