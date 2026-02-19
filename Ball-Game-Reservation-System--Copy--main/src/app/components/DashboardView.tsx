import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  PhilippinePeso,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function DashboardView() {
  const { currentUser, bookings, courts, users, cancelBooking, config } = useApp();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isCoach = currentUser?.role === 'coach';

  // Calculate Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const end = selectedDate;
    const start = subDays(end, 6);
    const days = eachDayOfInterval({ start, end });

    // Calculate daily capacity in minutes based on operating hours
    const [openH, openM] = config.openingTime.split(':').map(Number);
    const [closeH, closeM] = config.closingTime.split(':').map(Number);
    const minutesPerDay = (closeH * 60 + closeM) - (openH * 60 + openM);
    const totalCapacity = minutesPerDay * courts.length;

    return days.map(day => {
      const dayBookings = bookings.filter(b => 
        isSameDay(new Date(b.date), day) && b.status !== 'cancelled'
      );

      const revenue = dayBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const bookedMinutes = dayBookings.reduce((sum, b) => sum + (b.duration || 0), 0);
      const utilization = totalCapacity > 0 ? Math.round((bookedMinutes / totalCapacity) * 100) : 0;

      return {
        name: format(day, 'EEE'),
        revenue,
        utilization
      };
    });
  }, [bookings, courts, config, selectedDate]);

  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed' && new Date(b.date) >= new Date()).length;
  const avgUtilization = chartData.length > 0 ? Math.round(chartData.reduce((acc, curr) => acc + curr.utilization, 0) / chartData.length) : 0;
  const totalPlayers = users.filter(u => u.role === 'player').length;

  const stats = isCoach ? [
    { title: "Total Students", value: "24", change: "+4", isPositive: true, icon: Users },
    { title: "Upcoming Sessions", value: "8", change: "This Week", isPositive: true, icon: Calendar },
    { title: "Hours Coached", value: "142", change: "+12.5%", isPositive: true, icon: Clock },
    { title: "Avg. Rating", value: "4.9", change: "+0.1", isPositive: true, icon: Star },
  ] : [
    { title: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, change: "+12.5%", isPositive: true, icon: PhilippinePeso },
    { title: "Active Bookings", value: activeBookingsCount.toString(), change: "+8.2%", isPositive: true, icon: Calendar },
    { title: "Court Utilization", value: `${avgUtilization}%`, change: "-2.4%", isPositive: false, icon: TrendingUp },
    { title: "Total Players", value: totalPlayers.toString(), change: "+15.3%", isPositive: true, icon: Users },
  ];

  // Filter bookings for the upcoming sessions list
  const filteredBookings = bookings
    .filter(b => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(b.date);
      const isFuture = bookingDate >= today;
      
      if (isCoach) {
        return isFuture && b.userId === currentUser?.id && b.status !== 'cancelled';
      }
      return isFuture && b.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const displaySessions = filteredBookings.map(b => {
    const court = courts.find(c => c.id === b.courtId);
    const user = users.find(u => u.id === b.userId);
    return {
      id: b.id,
      player: user?.name || 'Unknown',
      court: court ? `${court.name} (${court.type})` : 'Unknown Court',
      time: `${b.startTime} - ${b.endTime}`,
      type: b.type.charAt(0).toUpperCase() + b.type.slice(1).replace('_', ' ')
    };
  });

  const handleCancel = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to cancel this session?')) {
      try {
        await cancelBooking(String(id));
        toast.success('Session cancelled successfully');
      } catch (error) {
        toast.error('Failed to cancel session');
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {isCoach ? "Track your coaching performance and schedule." : "Welcome back! Here's what's happening today."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">Revenue & Utilization</h3>
            <div className="relative z-10">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                className="text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 px-3 py-2 w-36 cursor-pointer"
                dateFormat="MMM dd, yyyy"
              />
            </div>
          </div>
          <div className="h-[320px] w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Upcoming Sessions</h3>
          <div className="space-y-4">
            {displaySessions.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming sessions scheduled.</p>
            )}
            {displaySessions.map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{booking.player}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{booking.court}</p>
                  <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-1">{booking.time} • {booking.type}</p>
                </div>
                {isCoach && (
                  <button
                    onClick={(e) => handleCancel(e, booking.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Cancel Session"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate(currentUser?.role === 'admin' || currentUser?.role === 'staff' ? '/court-mgmt' : '/my-bookings')}
            className="w-full mt-6 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
          <Icon size={24} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        )}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}
