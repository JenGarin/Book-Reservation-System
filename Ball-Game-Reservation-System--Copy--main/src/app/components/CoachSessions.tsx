import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Calendar, Clock, Users, Plus, X, CheckCircle, MapPin, UserCheck, UserX } from 'lucide-react';
import { format, isSameDay, addDays, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { Booking } from '@/types';

export function CoachSessions() {
  const { currentUser, bookings, courts, createBooking, cancelBooking, users, markStudentAttendance } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id || '');
  const [duration, setDuration] = useState(60);
  const [maxStudents, setMaxStudents] = useState(4);
  const [notes, setNotes] = useState('');
  const [attendanceModalOpen, setAttendanceModalOpen] = useState<string | null>(null);

  // Filter bookings for this coach
  const mySessions = bookings
    .filter(b => b.userId === currentUser?.id && b.type === 'training' && b.status !== 'cancelled')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const upcomingSessions = mySessions.filter(b => b.date >= startOfToday());
  const pastSessions = mySessions.filter(b => b.date < startOfToday());

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const court = courts.find(c => c.id === selectedCourt);
    if (!court) return;

    // Calculate end time
    const [startH, startM] = selectedTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + duration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    try {
      await createBooking({
        courtId: selectedCourt,
        userId: currentUser.id,
        type: 'training',
        date: selectedDate,
        startTime: selectedTime,
        endTime,
        duration,
        status: 'confirmed',
        paymentStatus: 'paid', // Assuming coach pays or system handles differently
        amount: 0, // Or calculate based on court rate
        maxPlayers: maxStudents,
        players: [], // Students will join later
        notes,
        checkedIn: false
      });
      toast.success('Training session created successfully');
      setIsModalOpen(false);
      // Reset form
      setNotes('');
      setSelectedTime('');
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleCancelSession = async (id: string) => {
    if (confirm('Are you sure you want to cancel this session?')) {
      await cancelBooking(id);
      toast.success('Session cancelled');
    }
  };

  const toggleAttendance = async (sessionId: string, studentId: string, currentStatus: boolean) => {
    await markStudentAttendance(sessionId, studentId, !currentStatus);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coaching Sessions</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your training schedule and students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 dark:shadow-none"
        >
          <Plus size={20} />
          New Session
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Sessions List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map(session => {
                const court = courts.find(c => c.id === session.courtId);
                return (
                  <div key={session.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-xs font-bold uppercase">
                          Training
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock size={14} /> {session.duration} min
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {format(session.date, 'EEEE, MMM dd')} at {session.startTime}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={16} /> {court?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={16} /> {session.players?.length || 0} / {session.maxPlayers || 4} Students
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          {session.notes}
                        </p>
                      )}
                      
                      {/* Attendance Section */}
                      {session.players && session.players.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Attendance</h4>
                          <div className="space-y-2">
                            {session.players.map(playerId => {
                              const student = users.find(u => u.id === playerId);
                              const isPresent = session.playerAttendance?.[playerId] || false;
                              return (
                                <div key={playerId} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-300">{student?.name || 'Unknown Student'}</span>
                                  <button
                                    onClick={() => toggleAttendance(session.id, playerId, isPresent)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      isPresent 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {isPresent ? <UserCheck size={14} /> : <UserX size={14} />}
                                    {isPresent ? 'Present' : 'Absent'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                      <button 
                        onClick={() => handleCancelSession(session.id)}
                        className="w-full py-2 px-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats / Past Sessions */}
        <div className="space-y-8">
          <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-100 dark:shadow-none">
            <h3 className="font-bold text-lg mb-4">Coach Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-teal-100 text-xs uppercase font-bold">Total Sessions</p>
                <p className="text-2xl font-bold">{mySessions.length}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-teal-100 text-xs uppercase font-bold">Students</p>
                <p className="text-2xl font-bold">
                  {new Set(mySessions.flatMap(s => s.players || [])).size}
                </p>
              </div>
            </div>
          </div>

          {/* ... (rest of the component remains similar to previous version) ... */}
        </div>
      </div>

      {/* ... (Create Session Modal remains similar) ... */}
    </div>
  );
}