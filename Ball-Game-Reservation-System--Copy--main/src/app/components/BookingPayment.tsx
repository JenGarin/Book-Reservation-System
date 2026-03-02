import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { backendApi } from '@/context/backendApi';

type PaymentMethod = 'gcash' | 'maya';

interface BookingDraft {
  courtId: string;
  type: 'open_play' | 'private' | 'training';
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  amount: number;
  bookingHoldId?: string;
  maxPlayers?: number;
  players?: string[];
}

const WALLET_LINKS: Record<PaymentMethod, { appUrl: string; webUrl: string }> = {
  gcash: {
    appUrl: 'gcash://',
    webUrl: 'https://www.gcash.com/',
  },
  maya: {
    appUrl: 'maya://',
    webUrl: 'https://www.maya.ph/',
  },
};

export function BookingPayment() {
  const { currentUser, createBooking, courts } = useApp();
  const usingBackendApi = backendApi.isEnabled;
  const location = useLocation();
  const navigate = useNavigate();
  const draft = (location.state as { bookingDraft?: BookingDraft } | null)?.bookingDraft;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const releaseHoldIfNeeded = async () => {
    if (!usingBackendApi) return;
    const holdId = String(draft?.bookingHoldId || '').trim();
    if (!holdId) return;
    try {
      await backendApi.releaseBookingHold(holdId);
    } catch {
      // Ignore if hold already expired/consumed/released.
    }
  };

  const handleCancel = async () => {
    await releaseHoldIfNeeded();
    navigate('/booking');
  };

  const courtName = useMemo(() => {
    if (!draft) return '';
    const court = courts.find((c) => c.id === draft.courtId);
    return court?.name || 'Selected Court';
  }, [courts, draft]);

  if (!draft || !currentUser) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Booking details are missing.</p>
          <button
            type="button"
            onClick={() => navigate('/booking')}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            Back to Book a Court
          </button>
        </div>
      </div>
    );
  }

  const handleSubmitPayment = async () => {
    if (!mobileNumber.trim()) {
      toast.error('Please enter your mobile number.');
      return;
    }

    if (!usingBackendApi) {
      const { appUrl, webUrl } = WALLET_LINKS[paymentMethod];
      const appWindow = window.open(appUrl, '_blank', 'noopener,noreferrer');
      if (!appWindow) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      } else {
        setTimeout(() => {
          if (appWindow.closed) {
            window.open(webUrl, '_blank', 'noopener,noreferrer');
          }
        }, 1200);
      }
    }

    if (usingBackendApi && draft.bookingHoldId) {
      try {
        const dateKey = format(new Date(draft.date), 'yyyy-MM-dd');
        const holds = await backendApi.getMyBookingHolds({
          courtId: draft.courtId,
          date: dateKey,
        });
        const hasActiveHold = (Array.isArray(holds) ? holds : []).some(
          (hold: any) => String(hold?.id || '') === String(draft.bookingHoldId)
        );
        if (!hasActiveHold) {
          toast.error('Your hold expired. Please reselect your booking slot.');
          navigate('/booking');
          return;
        }
      } catch {
        toast.error('Unable to validate your booking hold. Please try again.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const bookingId = await createBooking({
        courtId: draft.courtId,
        userId: currentUser.id,
        type: draft.type,
        date: new Date(draft.date),
        startTime: draft.startTime,
        endTime: draft.endTime,
        duration: draft.duration,
        status: 'pending',
        paymentStatus: usingBackendApi ? 'unpaid' : 'paid',
        amount: draft.amount,
        checkedIn: false,
        maxPlayers: draft.maxPlayers,
        players: draft.players,
      });

      if (usingBackendApi) {
        const tx = await backendApi.createPaymentCheckout(bookingId, paymentMethod);
        const checkoutUrl = String(tx?.checkoutUrl || '').trim();
        if (checkoutUrl) {
          window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        }
        toast.success('Payment checkout created. Complete payment in your wallet to finalize booking.');
      } else {
        toast.success('Payment successful. Booking request sent to admin for approval.');
      }
      navigate('/my-bookings');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl text-slate-900 dark:text-slate-100">Complete Payment</h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">Pay securely using your preferred e-wallet</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#d8ecea] dark:bg-slate-800 rounded-xl p-4 md:p-5 space-y-3 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl text-slate-900 dark:text-slate-100">Booking Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm md:text-base text-slate-800 dark:text-slate-200">
            <span>Court:</span><span className="text-right">{courtName}</span>
            <span>Date:</span><span className="text-right">{format(new Date(draft.date), 'MMMM d, yyyy')}</span>
            <span>Time:</span><span className="text-right">{draft.startTime}</span>
            <span>Duration:</span><span className="text-right">{draft.duration / 60} hour</span>
          </div>
          <div className="h-px bg-slate-400/40 dark:bg-slate-600/40 my-2" />
          <div className="flex items-center justify-between text-lg md:text-xl text-slate-900 dark:text-slate-100">
            <span className="font-semibold">Amount to Pay:</span>
            <span className="font-semibold">PHP {draft.amount.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl text-slate-900 dark:text-slate-100 mb-3">Select Payment Method</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('gcash')}
              className={`w-full border rounded-xl p-3.5 flex items-center justify-between transition-colors ${
                paymentMethod === 'gcash' ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'gcash' ? 'bg-black border-black' : 'border-slate-400'}`} />
                <img
                  src="/gcash.png"
                  alt="Gcash"
                  className="w-10 h-10 object-contain rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="text-left">
                  <p className="text-base md:text-lg text-slate-900 dark:text-slate-100">Gcash</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pay via Gcash wallet</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('maya')}
              className={`w-full border rounded-xl p-3.5 flex items-center justify-between transition-colors ${
                paymentMethod === 'maya' ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'maya' ? 'bg-black border-black' : 'border-slate-400'}`} />
                <img
                  src="/maya.png"
                  alt="Maya"
                  className="w-10 h-10 object-contain rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="text-left">
                  <p className="text-base md:text-lg text-slate-900 dark:text-slate-100">Maya</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pay via Maya wallet</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-base md:text-lg text-slate-900 dark:text-slate-100 mb-2">
            {paymentMethod === 'gcash' ? 'Gcash Mobile Number' : 'Maya Mobile Number'}
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="09XX XXX XXXX"
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {paymentMethod === 'gcash' ? 'Enter your Gcash registered number' : 'Enter your Maya registered number'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitPayment}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? 'Processing...' : `Pay PHP ${draft.amount.toFixed(2)}`}
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {usingBackendApi
            ? 'Backend Mode: Complete payment using the generated wallet checkout.'
            : 'Demo Mode: Payment will be simulated. No actual charges will be made.'}
        </div>
      </div>
    </div>
  );
}
