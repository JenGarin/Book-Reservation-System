import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock3, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COURT_META: Record<string, { location: string; sport: string }> = {
  c1: { location: 'Downtown Sports Complex', sport: 'Basketball' },
  c2: { location: 'Riverside Park', sport: 'Tennis' },
  c3: { location: 'Elite Sports Hub', sport: 'Pickleball' },
};

export function BookingHistoryView() {
  const { currentUser, bookings, courts, cancelBooking } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('past');

  const allUserBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.userId === currentUser?.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [bookings, currentUser]
  );

  const upcomingBookings = useMemo(
    () =>
      allUserBookings.filter(
        (b) =>
          b.date >= new Date() &&
          b.status !== 'cancelled' &&
          b.status !== 'completed' &&
          b.status !== 'no_show'
      ),
    [allUserBookings]
  );

  const pastBookings = useMemo(
    () =>
      allUserBookings.filter(
        (b) =>
          b.status === 'completed'
      ),
    [allUserBookings]
  );

  const upcomingCount = upcomingBookings.length;
  const pastCount = pastBookings.length;
  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-teal-100 text-teal-700',
      pending: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-rose-100 text-rose-700',
      completed: 'bg-emerald-100 text-emerald-700',
      no_show: 'bg-slate-200 text-slate-700',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-200 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-5">
        <header className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">History</h1>
            <p className="text-slate-600 text-sm">{allUserBookings.length} total records</p>
          </div>
        </header>

        <section className="rounded-3xl border border-[#7ea39f] bg-[#8eaaa4] p-4 md:p-5 shadow-sm">
          <div className="rounded-2xl border border-slate-300 bg-white p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Booking History</h2>
              <p className="text-sm text-slate-600">Past and completed reservations</p>
            </div>

            <div className="w-full rounded-full bg-slate-200 p-1 mb-4 grid grid-cols-2 gap-1 text-xs font-semibold text-center">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`rounded-full py-1.5 transition-colors ${
                  activeTab === 'upcoming' ? 'bg-white text-slate-900' : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`rounded-full py-1.5 transition-colors ${
                  activeTab === 'past' ? 'bg-white text-slate-900' : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                Past ({pastCount})
              </button>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {displayedBookings.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  {activeTab === 'upcoming' ? 'No upcoming records.' : 'No past records yet.'}
                </div>
              )}

              {displayedBookings.map((booking) => {
                const court = courts.find((c) => c.id === booking.courtId);
                const meta = COURT_META[booking.courtId] || { location: court?.name || 'Court Location', sport: 'General' };
                const isUpcoming = booking.date >= new Date() && booking.status !== 'cancelled';
                const ratePerHour = court?.hourlyRate || 0;

                return (
                  <article key={booking.id} className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{court?.name || 'Unknown Court'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full border border-slate-300 bg-white text-xs text-slate-700">
                        {meta.sport}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-700 space-y-1.5">
                      <p className="inline-flex items-center gap-1.5"><MapPin size={13} /> {meta.location}</p>
                      <p className="inline-flex items-center gap-1.5"><Calendar size={13} /> {format(booking.date, 'MMMM dd, yyyy')}</p>
                      <p className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {booking.startTime} - {booking.endTime} ({Math.round(booking.duration / 60)} Hours)</p>
                    </div>

                    {booking.notes && (
                      <p className="mt-3 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
                        {booking.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">P{ratePerHour}/hour</p>
                        <p className="text-2xl font-bold text-slate-900">Total: P{booking.amount.toFixed(0)}</p>
                      </div>

                      {booking.status === 'confirmed' && booking.date >= new Date() && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm font-semibold inline-flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          {!booking.checkedIn && (
                            <button
                              onClick={() => navigate('/check-in', { state: { from: `${location.pathname}${location.search}` } })}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Check In
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
