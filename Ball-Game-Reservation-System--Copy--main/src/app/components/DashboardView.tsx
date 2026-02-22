import React from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  PhilippinePeso,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ClipboardList,
  ScanLine,
  Building2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isSameDay } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getChangeTag(value: number) {
  if (value >= 0) return { text: `+${value}%`, positive: true };
  return { text: `${value}%`, positive: false };
}

export function DashboardView() {
  const { bookings, courts, users, config } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const activeBookingsCount = bookings.filter((b) => b.status === 'confirmed' && new Date(b.date) >= new Date()).length;
  const totalPlayers = users.filter((u) => u.role === 'player').length;

  const [openH, openM] = config.openingTime.split(':').map(Number);
  const [closeH, closeM] = config.closingTime.split(':').map(Number);
  const minutesPerDay = (closeH * 60 + closeM) - (openH * 60 + openM);
  const totalBookedMinutes = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.duration || 0), 0);
  const maxBookableMinutes = Math.max(1, minutesPerDay * courts.length);
  const avgUtilization = Math.min(100, Math.round((totalBookedMinutes / maxBookableMinutes) * 100));

  const stats = [
    {
      title: 'Total Revenue',
      value: `PHP ${totalRevenue.toLocaleString()}`,
      change: getChangeTag(12.5),
      icon: PhilippinePeso,
    },
    {
      title: 'Active Bookings',
      value: activeBookingsCount.toString(),
      change: getChangeTag(8.2),
      icon: Calendar,
    },
    {
      title: 'Court Utilization',
      value: `${avgUtilization}%`,
      change: getChangeTag(-2.4),
      icon: TrendingUp,
    },
    {
      title: 'Total Players',
      value: totalPlayers.toString(),
      change: getChangeTag(15.3),
      icon: Users,
    },
  ];

  const today = new Date();
  const pendingRequests = bookings
    .filter((b) => b.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const todayBookings = bookings.filter((b) => isSameDay(new Date(b.date), today) && b.status !== 'cancelled');
  const checkedInToday = todayBookings.filter((b) => b.checkedIn).length;
  const maintenanceCourts = courts.filter((c) => c.status === 'maintenance').length;
  const openCourts = courts.filter((c) => c.status === 'active').length;

  const upcomingBookings = bookings
    .filter((b) => new Date(b.date) >= new Date() && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((b) => {
      const court = courts.find((c) => c.id === b.courtId);
      const user = users.find((u) => u.id === b.userId);
      return {
        id: b.id,
        player: user?.name || 'Unknown',
        court: court ? `${court.name} (${court.type})` : 'Unknown Court',
        time: `${b.startTime} - ${b.endTime}`,
        date: format(new Date(b.date), 'MMM dd'),
        type: b.type.charAt(0).toUpperCase() + b.type.slice(1).replace('_', ' '),
      };
    });

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-200">Operations snapshot for requests, check-ins, and courts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change.text}
            isPositive={stat.change.positive}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Operations Board</h3>
            <span className="text-xs text-slate-500">Updated {format(new Date(), 'MMM dd, yyyy')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Pending Requests</p>
                <ClipboardList size={18} className="text-teal-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-2">{pendingRequests.length}</p>
              <button
                onClick={() => navigate('/requests')}
                className="mt-3 text-sm text-teal-700 font-medium hover:text-teal-800"
              >
                Review Requests
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Today Check-Ins</p>
                <ScanLine size={18} className="text-teal-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {checkedInToday}/{todayBookings.length || 0}
              </p>
              <button
                onClick={() => navigate('/check-in', { state: { from: `${location.pathname}${location.search}` } })}
                className="mt-3 text-sm text-teal-700 font-medium hover:text-teal-800"
              >
                Open Check-In
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Court Status</p>
                <Building2 size={18} className="text-teal-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-2">{openCourts} Open</p>
              <p className="text-sm text-slate-600 mt-1">{maintenanceCourts} in maintenance</p>
              <button
                onClick={() => navigate('/court-mgmt')}
                className="mt-3 text-sm text-teal-700 font-medium hover:text-teal-800"
              >
                Manage Courts
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600 font-medium">Queue Snapshot</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>New requests (24h)</span>
                  <span className="font-semibold">
                    {
                      pendingRequests.filter((b) => {
                        const createdAt = new Date(b.createdAt);
                        return Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
                      }).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Confirmed today</span>
                  <span className="font-semibold">{todayBookings.filter((b) => b.status === 'confirmed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cancelled today</span>
                  <span className="font-semibold">{todayBookings.filter((b) => b.status === 'cancelled').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-colors">
          <h3 className="font-semibold text-slate-900 mb-6">Upcoming Sessions</h3>
          <div className="space-y-4">
            {upcomingBookings.length === 0 && (
              <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>
            )}
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{booking.player}</p>
                  <p className="text-xs text-slate-500">{booking.court}</p>
                  <p className="text-xs font-medium text-teal-600 mt-1">
                    {booking.date} • {booking.time} • {booking.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/court-mgmt')}
            className="w-full mt-6 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
          >
            View All Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
          <Icon size={24} />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          )}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
