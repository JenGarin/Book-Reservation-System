import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Calendar, Clock, MapPin, PhilippinePeso, Users as UsersIcon, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, addMonths, startOfToday, isSameDay, isSameMonth, parse } from 'date-fns';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const COURT_DISPLAY_NAMES: Record<string, string> = {
  c1: 'Downtown Basketball Court A',
  c2: 'Riverside Tennis Court 1',
  c3: 'Pickle Ball Court 1',
};

export function BookingInterface() {
  const { courts, config, createBooking, getAvailableSlots, currentUser, bookings, joinSession, users } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const prefillCourtId = (location.state as { prefillCourtId?: string } | null)?.prefillCourtId;
  const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [visibleMonth, setVisibleMonth] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingType, setBookingType] = useState<'open_play' | 'private' | 'training'>('private');
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (!courts.length) return;

    if (prefillCourtId && courts.some((c) => c.id === prefillCourtId)) {
      setSelectedCourt(prefillCourtId);
      return;
    }

    if (!selectedCourt) {
      setSelectedCourt(courts[0]?.id || '');
    }
  }, [courts, prefillCourtId, selectedCourt]);

  const availableSlots = selectedCourt ? getAvailableSlots(selectedCourt, selectedDate, bookingType) : [];
  const selectedCourtData = courts.find((c) => c.id === selectedCourt);
  const getCourtDisplayName = (courtId: string, fallbackName: string) =>
    COURT_DISPLAY_NAMES[courtId] || fallbackName;
  const today = startOfToday();
  const calendarMaxDate = addMonths(today, 12);

  // Find existing sessions to join
  const joinableSessions = bookings.filter(b => 
    b.courtId === selectedCourt &&
    isSameDay(b.date, selectedDate) &&
    b.status !== 'cancelled' &&
    (b.type === 'open_play' || b.type === 'training') &&
    bookingType === b.type &&
    (b.players?.length || 0) < (b.maxPlayers || 4) &&
    !b.players?.includes(currentUser?.id || '')
  );

  const calculatePrice = () => {
    if (!selectedCourtData) return 0;
    const hours = duration / 60;
    // Check if in peak hours (simplified)
    const isPeak = config.peakHours.some((ph) => {
      return selectedTime >= ph.start && selectedTime <= ph.end;
    });
    const rate = isPeak && selectedCourtData.peakHourRate
      ? selectedCourtData.peakHourRate
      : selectedCourtData.hourlyRate;
    return rate * hours;
  };

  const handleBooking = () => {
    if (!selectedCourt || !selectedTime || !currentUser) {
      toast.error('Please select court, date and time');
      return;
    }

    const endHour = parseInt(selectedTime.split(':')[0]) + Math.floor(duration / 60);
    const endMin = parseInt(selectedTime.split(':')[1]) + (duration % 60);
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    navigate('/booking/payment', {
      state: {
        bookingDraft: {
          courtId: selectedCourt,
          type: bookingType,
          date: selectedDate.toISOString(),
          startTime: selectedTime,
          endTime,
          duration,
          amount: calculatePrice(),
          maxPlayers: bookingType === 'open_play' ? 4 : undefined,
          players: bookingType === 'open_play' ? [currentUser.id] : undefined,
        },
      },
    });
  };

  const handleJoinSession = async (bookingId: string) => {
    try {
      await joinSession(bookingId);
      toast.success('Successfully joined the session!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join session');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-teal-600" />
          Book a Court
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-4">
            {/* Booking Type */}
            <div>
              <label className="block text-sm mb-2">Booking Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['private', 'open_play', 'training'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBookingType(type)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      bookingType === type
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Court Selection */}
            <div>
              <label className="block text-sm mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Select Court
              </label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {courts.filter(c => c.status === 'active').map((court) => (
                  <option key={court.id} value={court.id}>
                    {getCourtDisplayName(court.id, court.name)} - {court.courtNumber} ({court.type}, {court.surfaceType})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm mb-2">Select Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setVisibleMonth(date);
                    setSelectedTime('');
                  }}
                  onMonthChange={(date) => setVisibleMonth(date)}
                  minDate={today}
                  maxDate={calendarMaxDate}
                  dateFormat="MMMM d, yyyy"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholderText="Select booking date"
                  dayClassName={(date) =>
                    isSameMonth(date, visibleMonth) ? 'current-month-day' : 'outside-month-day'
                  }
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between px-2 py-1 mb-2">
                      <button
                        type="button"
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-slate-800">
                        {format(date, 'MMMM yyyy')}
                      </span>
                      <button
                        type="button"
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Right Column - Available Slots */}
          <div>
            <label className="block text-sm mb-2">Available Time Slots</label>
            
            {/* Joinable Sessions Section */}
            {(bookingType === 'open_play' || bookingType === 'training') && joinableSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-teal-700 mb-2">Join Existing Sessions</h3>
                <div className="space-y-2">
                  {joinableSessions.map(session => {
                    const host = users.find(u => u.id === session.userId);
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-teal-100 bg-teal-50 rounded-lg">
                        <div>
                          <div className="font-medium text-teal-900">{session.startTime} - {session.endTime}</div>
                          <div className="text-xs text-teal-600 flex items-center gap-1">
                            <UsersIcon size={12} />
                            {session.players?.length || 0} / {session.maxPlayers || 4} Players
                            {host && <span className="ml-1 text-teal-500">• Host: {host.name}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinSession(session.id)}
                          className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-md hover:bg-teal-700 transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No available slots</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedTime === slot
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        {selectedTime && selectedCourtData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg mb-3">Booking Summary</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Court:</span>
                  <span>{getCourtDisplayName(selectedCourtData.id, selectedCourtData.name)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{selectedTime} ({duration} min)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{bookingType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total:</span>
                  <span className="flex items-center gap-1">
                    ₱{calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBooking}
              className="w-full mt-4 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Court Information */}
      {selectedCourtData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg mb-4">Court Information</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Court</div>
              <div>{getCourtDisplayName(selectedCourtData.id, selectedCourtData.name)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Surface</div>
              <div className="capitalize">{selectedCourtData.surfaceType}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Standard Rate</div>
              <div>₱{selectedCourtData.hourlyRate}/hr</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">Peak Rate</div>
              <div>₱{selectedCourtData.peakHourRate || selectedCourtData.hourlyRate}/hr</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
