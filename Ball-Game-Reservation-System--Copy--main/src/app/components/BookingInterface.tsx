import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { addMinutes, format } from 'date-fns';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

type BookingType = 'private' | 'open_play' | 'training';

const COURT_SPORT: Record<string, string> = {
  c1: 'Basketball',
  c2: 'Tennis',
  c3: 'Pickle Ball',
};

const toTimeLabel = (minutes: number) => {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${(minutes / 60).toFixed(1).replace(/\.0$/, '')} hours`;
};

const formatHHmm = (date: Date) => format(date, 'HH:mm');

export function BookingInterface() {
  const { currentUser, courts, config } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillCourtId = (location.state as { prefillCourtId?: string } | null)?.prefillCourtId;

  const defaultCourtId = prefillCourtId || courts.find((c) => c.status === 'active')?.id || '';
  const [name, setName] = useState(currentUser?.name || '');
  const [selectedCourtId, setSelectedCourtId] = useState(defaultCourtId);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(config.bookingInterval || 60);
  const [bookingType, setBookingType] = useState<BookingType>('private');

  const selectedCourt = useMemo(() => courts.find((c) => c.id === selectedCourtId), [courts, selectedCourtId]);

  const timeOptions = useMemo(() => {
    const step = config.bookingInterval || 30;
    const options: string[] = [];

    for (let mins = 0; mins < 24 * 60; mins += step) {
      const hh = String(Math.floor(mins / 60)).padStart(2, '0');
      const mm = String(mins % 60).padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }

    return options;
  }, [config.bookingInterval]);

  const rateForTime = (startTime: string) => {
    if (!selectedCourt) return 0;
    const isPeak = config.peakHours.some((peak) => startTime >= peak.start && startTime <= peak.end);
    return isPeak && selectedCourt.peakHourRate ? selectedCourt.peakHourRate : selectedCourt.hourlyRate;
  };

  const totalPrice = useMemo(() => {
    if (!selectedCourt || !selectedTime) return 0;
    const hourly = rateForTime(selectedTime);
    return (hourly * duration) / 60;
  }, [duration, selectedCourt, selectedTime]);

  const endTime = useMemo(() => {
    if (!selectedTime) return '';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    return formatHHmm(addMinutes(startDate, duration));
  }, [duration, selectedTime]);

  const handleProceed = () => {
    if (!currentUser) {
      toast.error('Please sign in to continue.');
      return;
    }
    if (!selectedCourt) {
      toast.error('Please select a court.');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date.');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a start time.');
      return;
    }
    if (!duration || duration <= 0) {
      toast.error('Please enter a valid duration.');
      return;
    }

    const dateObj = new Date(`${selectedDate}T00:00:00`);
    navigate('/booking/payment', {
      state: {
        bookingDraft: {
          courtId: selectedCourt.id,
          type: bookingType,
          date: dateObj.toISOString(),
          startTime: selectedTime,
          endTime,
          duration,
          amount: totalPrice,
        },
      },
    });
  };

  if (!selectedCourt) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow p-6 text-center">
          <p className="text-slate-700 dark:text-slate-300 mb-4">No active court is available for booking.</p>
          <button
            type="button"
            onClick={() => navigate('/booking')}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            Back to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] p-3 sm:p-4 md:p-6 xl:p-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-5 md:p-8 xl:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">Book {selectedCourt.name}</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Select your preferred date and time to reserve this {COURT_SPORT[selectedCourt.id] || 'court'} court.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 dark:text-slate-100 outline-none focus:border-teal-600"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Select date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
                  <input
                    type="date"
                    value={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3 text-base text-slate-900 dark:text-slate-100 outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Court</label>
                <select
                  value={selectedCourtId}
                  onChange={(e) => {
                    setSelectedCourtId(e.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-base text-slate-900 dark:text-slate-100 outline-none focus:border-teal-600"
                >
                  {courts
                    .filter((c) => c.status === 'active')
                    .map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Start Time</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`h-11 rounded-lg border text-sm transition-colors sm:text-base ${
                      selectedTime === time
                        ? 'border-teal-700 bg-teal-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Duration (hours)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={duration / 60}
                  onChange={(e) => {
                    const hours = Number(e.target.value);
                    if (Number.isFinite(hours) && hours > 0) {
                      setDuration(Math.round(hours * 60));
                    }
                  }}
                  className="h-12 w-full max-w-[220px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 dark:text-slate-100 outline-none focus:border-teal-600"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">Enter any duration in hours (e.g. 1.5, 2, 3.5).</p>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Booking Type</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['private', 'open_play', 'training'] as BookingType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBookingType(type)}
                    className={`h-11 rounded-lg border text-sm capitalize transition-colors sm:text-base ${
                      bookingType === type
                        ? 'border-teal-700 bg-teal-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-fit xl:sticky xl:top-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Booking Summary</h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#d6e8e8] dark:bg-slate-800 p-4">
              <div className="grid grid-cols-2 gap-y-1 text-base text-slate-800 dark:text-slate-200">
                <span>Court:</span>
                <span className="text-right">{selectedCourt.name}</span>
                <span>Sport:</span>
                <span className="text-right">{COURT_SPORT[selectedCourt.id] || 'General'}</span>
                <span>Date:</span>
                <span className="text-right">{selectedDate ? format(new Date(`${selectedDate}T00:00:00`), 'MMMM d, yyyy') : 'Not selected'}</span>
                <span>Time:</span>
                <span className="text-right">{selectedTime ? `${selectedTime} - ${endTime}` : 'Not selected'}</span>
                <span>Duration:</span>
                <span className="text-right">{toTimeLabel(duration)}</span>
                <span>Rate:</span>
                <span className="text-right">PHP {selectedTime ? rateForTime(selectedTime).toFixed(0) : '0'}/hour</span>
              </div>
              <div className="h-px bg-slate-400/40 dark:bg-slate-600/40 my-3" />
              <div className="flex items-center justify-between text-xl font-bold text-slate-900 dark:text-slate-100">
                <span>Total Price:</span>
                <span>PHP {totalPrice.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/booking')}
            className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="h-11 rounded-lg bg-teal-600 px-6 text-white hover:bg-teal-700 sm:w-auto"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
