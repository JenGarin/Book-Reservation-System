import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, CheckCircle, XCircle, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

export function CheckIn() {
  const { checkInBooking, bookings, courts, users } = useApp();
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{success: boolean; message: string; details?: any} | null>(null);

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bookingId.trim()) return;

    setIsProcessing(true);
    setScanResult(null);

    // Simulate scanning/processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normalize ID (handle case sensitivity or prefixes if needed)
    const targetId = bookingId.trim();
    const booking = bookings.find(b => b.id.toLowerCase() === targetId.toLowerCase());

    if (booking) {
      if (booking.checkedIn) {
         setScanResult({ success: false, message: 'Already checked in.' });
         toast.warning('Booking already checked in.');
      } else if (booking.status === 'cancelled') {
         setScanResult({ success: false, message: 'Booking is cancelled.' });
         toast.error('Cannot check in cancelled booking.');
      } else {
        await checkInBooking(booking.id);
        const court = courts.find(c => c.id === booking.courtId);
        const player = users.find(u => u.id === booking.userId);
        
        setScanResult({
            success: true,
            message: 'Check-in Successful',
            details: {
                court: court?.name,
                time: `${booking.startTime} - ${booking.endTime}`,
                player: player?.name || 'Guest Player'
            }
        });
        toast.success('Check-in successful!');
        setBookingId('');
      }
    } else {
        setScanResult({ success: false, message: 'Invalid Booking ID.' });
        toast.error('Booking not found.');
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 border-b border-slate-800">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft />
        </button>
        <h1 className="text-lg font-bold">Scanner</h1>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            {/* Mock Camera View */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent animate-pulse z-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={48} className="text-slate-700" />
                <p className="absolute mt-20 text-sm text-slate-500 font-medium">Align QR code within frame</p>
            </div>
            
            {/* Corner Markers */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl"></div>
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl"></div>
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl"></div>
        </div>

        {/* Result Display */}
        {scanResult && (
            <div className={`w-full max-w-sm p-4 rounded-xl border ${scanResult.success ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'} animate-in fade-in slide-in-from-bottom-4`}>
                <div className="flex items-start gap-3">
                    {scanResult.success ? <CheckCircle className="shrink-0" /> : <XCircle className="shrink-0" />}
                    <div>
                        <p className="font-bold">{scanResult.message}</p>
                        {scanResult.details && (
                            <div className="mt-1 text-sm opacity-90 text-slate-300">
                                <p>{scanResult.details.court}</p>
                                <p>{scanResult.details.time}</p>
                                <p className="text-xs mt-1 text-slate-400">{scanResult.details.player}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Manual Entry */}
        <div className="w-full max-w-sm space-y-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <QrCode className="h-5 w-5 text-slate-500" />
                </div>
                <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="Enter Booking ID (e.g. BK-9021)"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                />
            </div>
            <button
                onClick={() => handleCheckIn()}
                disabled={isProcessing || !bookingId}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Check In'}
            </button>
        </div>
      </div>
    </div>
  );
}