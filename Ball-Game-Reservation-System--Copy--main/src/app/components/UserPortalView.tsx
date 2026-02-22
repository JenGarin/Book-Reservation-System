import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  User,
  Settings,
  Bell,
  Award,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function UserPortalView() {
  const { currentUser, notifications, userSubscription, memberships, bookings, courts } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';

  const myNotifications = notifications.filter((n) => n.userId === currentUser?.id);
  const activePlan = userSubscription ? memberships.find((m) => m.id === userSubscription.membership_id) : null;

  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const nextBooking = bookings
    .filter((b) => {
      const isUpcomingConfirmed = b.status === 'confirmed' && new Date(b.date) >= new Date();
      if (!isUpcomingConfirmed) return false;
      return isAdmin ? true : b.userId === currentUser?.id;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const nextCourt = nextBooking ? courts.find((c) => c.id === nextBooking.courtId) : null;

  const handleReschedule = () => {
    if (isAdmin) {
      navigate('/requests');
      return;
    }

    toast.info('To reschedule, please cancel this booking and book a new slot.', {
      action: {
        label: 'Go to Bookings',
        onClick: () => navigate('/my-bookings'),
      },
    });
    navigate('/my-bookings');
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-3xl font-bold text-teal-700 overflow-hidden">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-teal-600 rounded-full border-4 border-white text-white">
                  <Award size={14} />
                </div>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-slate-500 text-sm">
                {isAdmin
                  ? 'Administrator Account'
                  : userSubscription
                    ? `Member since ${new Date(userSubscription.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                    : 'Free Member'}
              </p>

              <div className="flex gap-4 mt-6 w-full">
                <div className="flex-1 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">{isAdmin ? 'Role' : 'Skill Level'}</p>
                  <p className="font-bold text-teal-600 capitalize">
                    {isAdmin ? 'Administrator' : (currentUser?.skillLevel || 'beginner')}
                  </p>
                </div>
                <div className="flex-1 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">{isAdmin ? 'Access' : 'Current Plan'}</p>
                  <p className="font-bold text-teal-600">{isAdmin ? 'Full Access' : (activePlan?.name || 'Free Tier')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={() => navigate('/profile-settings')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm"
              >
                <div className="flex items-center gap-3">
                  <User size={18} /> Profile Details
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm">
                <div className="flex items-center gap-3">
                  <Settings size={18} /> {isAdmin ? 'Admin Preferences' : 'Preferences'}
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} /> {isAdmin ? 'System Access' : 'Billing & Payment'}
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm">
                <div className="flex items-center gap-3">
                  <Bell size={18} /> Notifications
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="bg-teal-600 p-6 rounded-2xl text-white shadow-lg shadow-teal-100 relative overflow-hidden">
            <h3 className="font-bold text-lg mb-2">{isAdmin ? 'Admin Controls' : 'Upgrade to Pro'}</h3>
            <p className="text-teal-100 text-xs mb-4">
              {isAdmin
                ? 'Manage users, court operations, pricing, and reports from your admin tools.'
                : 'Get 20% off all bookings and early access to court reservations.'}
            </p>
            <button
              onClick={() => navigate(isAdmin ? '/settings' : '/pricing')}
              className="w-full bg-white text-teal-600 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors"
            >
              {isAdmin ? 'Open Admin Settings' : 'View Membership Plans'}
            </button>
          </div>
        </div>

        <div className="lg:flex-1 space-y-8">
          {myNotifications.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="text-teal-600" size={20} />
                Recent Notifications
              </h3>
              <div className="space-y-3">
                {myNotifications.map((n) => (
                  <div key={n.id} className="p-4 bg-amber-50 text-amber-900 rounded-xl flex items-start gap-3 border border-amber-100">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-bold text-sm">{n.title}</p>
                      <p className="text-sm opacity-90">{n.message}</p>
                      <p className="text-xs text-amber-700/60 mt-1">{n.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nextBooking ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <QRCode value={nextBooking.id} size={120} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
                  {isAdmin ? 'Next Managed Booking' : 'Next Session'}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {nextCourt?.name || 'Unknown Court'}
                  {nextCourt?.type ? ` - ${nextCourt.type.charAt(0).toUpperCase()}${nextCourt.type.slice(1)}` : ''}
                </h3>
                <p className="text-slate-500 font-medium">{format(new Date(nextBooking.date), 'EEEE, MMM dd')} at {nextBooking.startTime}</p>
                <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                  <button
                    onClick={() => navigate('/check-in', { state: { from: `${location.pathname}${location.search}` } })}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-teal-700 transition-colors"
                  >
                    Check-in Now
                  </button>
                  <button
                    onClick={handleReschedule}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    {isAdmin ? 'Open Requests' : 'Reschedule'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{isAdmin ? 'No Upcoming Managed Bookings' : 'No Upcoming Sessions'}</h3>
              <p className="text-slate-500 mb-6">
                {isAdmin ? 'No confirmed bookings are scheduled right now.' : "You don't have any active bookings scheduled."}
              </p>
              <button
                onClick={() => navigate(isAdmin ? '/requests' : '/booking')}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-teal-700 transition-colors"
              >
                {isAdmin ? 'Go to Requests' : 'Book a Court'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
