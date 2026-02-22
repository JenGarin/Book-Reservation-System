import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, PhilippinePeso, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COURT_DISPLAY_NAMES: Record<string, string> = {
  c1: 'Downtown Basketball Court A',
  c2: 'Riverside Tennis Court 1',
  c3: 'Pickle Ball Court 1',
};

export function MyBookings() {
  const { currentUser, bookings, courts, cancelBooking } = useApp();
  const navigate = useNavigate();

  const myBookings = bookings
    .filter(b => b.userId === currentUser?.id)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
      no_show: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl">My Reservation</h1>
            <p className="text-gray-600 text-sm">{myBookings.length} total bookings</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {myBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by booking a court for your next game</p>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Book a Court
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => {
              const court = courts.find(c => c.id === booking.courtId);
              const courtDisplayName = court
                ? (COURT_DISPLAY_NAMES[court.id] || court.name)
                : 'Unknown Court';
              return (
                <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-xl mb-1">{courtDisplayName}</h3>
                        <p className="text-gray-600 text-sm">Court #{court?.courtNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      {booking.checkedIn && (
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Checked In
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Date</div>
                        <div>{format(booking.date, 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Time</div>
                        <div>{booking.startTime} - {booking.endTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhilippinePeso className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Amount</div>
                        <div>₱{booking.amount.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-gray-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Type</div>
                        <div className="capitalize">{booking.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Notes</div>
                      <div>{booking.notes}</div>
                    </div>
                  )}

                  {booking.status === 'cancelled' && booking.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 text-red-900 rounded-xl border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">
                      <p className="font-bold text-sm mb-1">Reason for Cancellation:</p>
                      <p className="text-sm">
                        {booking.rejectionReason}
                      </p>
                    </div>
                  )}

                  {booking.status === 'confirmed' && booking.date >= new Date() && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel Booking
                      </button>
                      {!booking.checkedIn && (
                        <button
                          onClick={() => navigate('/check-in')}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Check In
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
