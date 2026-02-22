import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  User,
  Court,
  Booking,
  FacilityConfig,
  MembershipPlan,
  Notification,
  BookingAnalytics,
  CourtUtilization,
  BookingType,
} from '@/types';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { supabase } from './supabase';

export interface UserSubscription {
  id: string;
  user_id: string;
  membership_id: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  created_at?: string;
}

type SignupPayload = {
  name?: string;
  phone?: string;
  coachProfile?: string;
  coachExpertise?: string[];
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  courts: Court[];
  bookings: Booking[];
  config: FacilityConfig;
  memberships: MembershipPlan[];
  userSubscription: UserSubscription | null;
  subscriptionHistory: UserSubscription[];
  notifications: Notification[];
  login: (email: string, password: string, expectedRole?: User['role']) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, role?: string, payload?: SignupPayload) => Promise<{ success: boolean; message?: string }>;
  signInWithProvider: (provider: 'google' | 'facebook', role?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addCourt: (court: Omit<Court, 'id'>) => Promise<void>;
  updateCourt: (id: string, court: Partial<Court>) => Promise<void>;
  deleteCourt: (id: string) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<string>;
  cancelBooking: (id: string) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  checkInBooking: (id: string) => Promise<void>;
  getAvailableSlots: (courtId: string, date: Date, bookingType?: BookingType) => string[];
  markStudentAttendance: (bookingId: string, studentId: string, attended: boolean) => Promise<void>;
  getBookingAnalytics: (startDate: Date, endDate: Date) => BookingAnalytics;
  getCourtUtilization: (courtId: string, startDate: Date, endDate: Date) => CourtUtilization[];
  updateConfig: (config: Partial<FacilityConfig>) => void;
  updateUser: (updates: Partial<User>) => void;
  adminUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
  adminDeleteUser: (id: string) => Promise<void>;
  addMembership: (membership: Omit<MembershipPlan, 'id'>) => Promise<void>;
  updateMembership: (id: string, updates: Partial<MembershipPlan>) => Promise<void>;
  deleteMembership: (id: string) => Promise<void>;
  subscribe: (planId: string) => Promise<void>;
  markAllNotificationsAsRead: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  joinSession: (bookingId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock Database Constants & Helpers
const STORAGE_KEYS = {
  USERS: 'ventra_users',
  COURTS: 'ventra_courts',
  BOOKINGS: 'ventra_bookings',
  MEMBERSHIPS: 'ventra_memberships',
  SUBSCRIPTIONS: 'ventra_subscriptions',
  NOTIFICATIONS: 'ventra_notifications',
  AUTH: 'ventra_auth', // Stores email:password mapping
  OAUTH_ROLE: 'ventra_oauth_role',
};

const SEED_USERS: User[] = [
  { id: 'admin-1', email: 'admin@court.com', name: 'Admin User', role: 'admin', avatar: '', phone: '123-456-7890', skillLevel: 'expert', createdAt: new Date() },
  { id: 'staff-1', email: 'staff@court.com', name: 'Staff Member', role: 'staff', avatar: '', phone: '123-456-7890', skillLevel: 'advanced', createdAt: new Date() },
  {
    id: 'coach-1',
    email: 'coach@court.com',
    name: 'Coach Mike',
    role: 'coach',
    avatar: '',
    phone: '123-456-7890',
    skillLevel: 'expert',
    coachVerificationStatus: 'verified',
    coachVerificationMethod: 'certification',
    coachVerificationDocumentName: 'National Coaching Certification',
    coachVerificationId: 'NCC-1024',
    coachVerificationNotes: 'Validated by club management.',
    coachVerificationSubmittedAt: new Date().toISOString(),
    createdAt: new Date()
  },
  { id: 'player-1', email: 'player@court.com', name: 'Alex Johnson', role: 'player', avatar: '', phone: '123-456-7890', skillLevel: 'intermediate', createdAt: new Date() },
];

const SEED_COURTS: Court[] = [
  { id: 'c1', name: 'Downtown Basketball Court A', courtNumber: '1', type: 'indoor', surfaceType: 'hardcourt', hourlyRate: 500, peakHourRate: 700, status: 'active', operatingHours: { start: '06:00', end: '22:00' } },
  { id: 'c2', name: 'Riverside Tennis Court 1', courtNumber: '2', type: 'indoor', surfaceType: 'wood', hourlyRate: 500, peakHourRate: 700, status: 'active', operatingHours: { start: '06:00', end: '22:00' } },
  { id: 'c3', name: 'Pickle Ball Court 1', courtNumber: '3', type: 'outdoor', surfaceType: 'concrete', hourlyRate: 300, peakHourRate: 450, status: 'active', operatingHours: { start: '06:00', end: '18:00' } },
];

const SEED_MEMBERSHIPS: MembershipPlan[] = [
  { id: 'm1', name: 'Basic', price: 1000, interval: 'month', tier: 'basic', description: 'Access to outdoor courts', features: ['Outdoor court access', '7 day advance booking'] },
  { id: 'm2', name: 'Pro', price: 2500, interval: 'month', tier: 'premium', description: 'All access pass', features: ['All courts access', '14 day advance booking', 'Priority support'] },
];

const defaultConfig: FacilityConfig = {
  openingTime: '07:00',
  closingTime: '22:00',
  bookingInterval: 60,
  bufferTime: 15,
  maxBookingDuration: 120,
  advanceBookingDays: 7,
  cancellationCutoffHours: 24,
  peakHours: [
    { start: '17:00', end: '21:00' },
    { start: '08:00', end: '12:00' },
  ],
  maintenanceMode: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing saved user from localStorage:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState<FacilityConfig>(defaultConfig);
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const upsertAndSetCurrentUser = (email: string, role: string = 'player') => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      localStorage.setItem('currentUser', JSON.stringify(existing));
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      role: role as any,
      avatar: '',
      phone: '',
      skillLevel: 'beginner',
      coachVerificationStatus: role === 'coach' ? 'unverified' : undefined,
      createdAt: new Date(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    persist(STORAGE_KEYS.USERS, updatedUsers);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  useEffect(() => {
    // Initialize Mock Database
    const initData = () => {
      // Users
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers).map((u: any) => ({
          ...u,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        }));
        setUsers(parsed);
      } else {
        setUsers(SEED_USERS);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      }

      // Courts
      const storedCourts = localStorage.getItem(STORAGE_KEYS.COURTS);
      if (storedCourts) {
        const parsedCourts = JSON.parse(storedCourts);
        const normalizedCourts = parsedCourts.map((court: Court) => {
          if (court.id === 'c1') return { ...court, name: 'Downtown Basketball Court A' };
          if (court.id === 'c2') return { ...court, name: 'Riverside Tennis Court 1' };
          if (court.id === 'c3') return { ...court, name: 'Pickle Ball Court 1' };
          return court;
        });
        setCourts(normalizedCourts);
        localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(normalizedCourts));
      } else {
        setCourts(SEED_COURTS);
        localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(SEED_COURTS));
      }

      // Bookings
      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings).map((b: any) => ({
          ...b,
          date: new Date(b.date),
          createdAt: new Date(b.createdAt),
          checkedInAt: b.checkedInAt ? new Date(b.checkedInAt) : undefined,
        }));
        setBookings(parsed);
      }

      // Memberships
      const storedMemberships = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
      if (storedMemberships) {
        setMemberships(JSON.parse(storedMemberships));
      } else {
        setMemberships(SEED_MEMBERSHIPS);
        localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(SEED_MEMBERSHIPS));
      }

      // Subscriptions & Notifications loaded on demand or below if needed
    };

    initData();
  }, []);

  useEffect(() => {
    const bootstrapOauthSession = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) return;

      const role = localStorage.getItem(STORAGE_KEYS.OAUTH_ROLE) || 'player';
      upsertAndSetCurrentUser(email, role);
      localStorage.removeItem(STORAGE_KEYS.OAUTH_ROLE);
    };

    bootstrapOauthSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email;
      if (!email) return;
      const role = localStorage.getItem(STORAGE_KEYS.OAUTH_ROLE) || 'player';
      upsertAndSetCurrentUser(email, role);
      localStorage.removeItem(STORAGE_KEYS.OAUTH_ROLE);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (storedSubs) {
        const allSubs: UserSubscription[] = JSON.parse(storedSubs);
        const userSubs = allSubs.filter(s => s.user_id === currentUser.id).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        setSubscriptionHistory(userSubs);
        const active = userSubs.find(s => s.status === 'active' && new Date(s.end_date) > new Date());
        setUserSubscription(active || null);
      }
    } else {
      setUserSubscription(null);
      setSubscriptionHistory([]);
    }
  }, [currentUser]);

  // Helper to save data
  const persist = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const login = async (
    email: string,
    password: string,
    expectedRole?: User['role']
  ): Promise<{ success: boolean; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const normalizedEmail = email.trim().toLowerCase();

    // Check seed credentials
    const seedCreds: Record<string, string> = {
      'admin@court.com': 'admin',
      'staff@court.com': 'staff',
      'coach@court.com': 'coach',
      'player@court.com': 'player',
      'junavirtudazo@gmail.com': 'admin' // Dev backdoor
    };

    // Check stored credentials
    const storedAuth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const storedAuthPassword = Object.entries(storedAuth).find(
      ([storedEmail]) => storedEmail.toLowerCase() === normalizedEmail
    )?.[1];
    
    const makeRoleMismatchMessage = (role: User['role']) => {
      const article = role === 'admin' ? 'an' : 'a';
      return `This account is not ${article} ${role} account.`;
    };

    if (seedCreds[normalizedEmail] === password || storedAuthPassword === password) {
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        if (expectedRole && user.role !== expectedRole) {
          return { success: false, message: makeRoleMismatchMessage(expectedRole) };
        }
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true };
      }

      // Recover missing local user record for valid credentials.
      const roleFromSeed = (normalizedEmail === 'admin@court.com' || normalizedEmail === 'junavirtudazo@gmail.com')
        ? 'admin'
        : normalizedEmail === 'staff@court.com'
          ? 'staff'
          : normalizedEmail === 'coach@court.com'
            ? 'coach'
            : 'player';

      if (expectedRole && roleFromSeed !== expectedRole) {
        return { success: false, message: makeRoleMismatchMessage(expectedRole) };
      }

      const recoveredUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: roleFromSeed,
        avatar: '',
        phone: '',
        skillLevel: roleFromSeed === 'admin' ? 'expert' : 'beginner',
        coachVerificationStatus: roleFromSeed === 'coach' ? 'unverified' : undefined,
        createdAt: new Date(),
      };

      const updatedUsers = [...users, recoveredUser];
      setUsers(updatedUsers);
      persist(STORAGE_KEYS.USERS, updatedUsers);
      setCurrentUser(recoveredUser);
      localStorage.setItem('currentUser', JSON.stringify(recoveredUser));
      return { success: true };
    }

    // Fallback for dev user if not in users list yet
    if (normalizedEmail === 'junavirtudazo@gmail.com') {
      const devUser = { id: 'dev-1', email: normalizedEmail, name: 'Juna Virtudazo', role: 'admin', avatar: '', phone: '', skillLevel: 'expert', createdAt: new Date() };
      if (expectedRole && devUser.role !== expectedRole) {
        return { success: false, message: makeRoleMismatchMessage(expectedRole) };
      }
      setCurrentUser(devUser);
      localStorage.setItem('currentUser', JSON.stringify(devUser));
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Please check your email and password.' };
  };

  const signup = async (
    email: string,
    password: string,
    role: string = 'player',
    payload: SignupPayload = {}
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email already exists' };
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: payload.name?.trim() || email.split('@')[0],
        role: role as any,
        avatar: '',
        phone: payload.phone?.trim() || '',
        skillLevel: 'beginner',
        coachProfile: role === 'coach' ? payload.coachProfile?.trim() || '' : undefined,
        coachExpertise: role === 'coach' ? (payload.coachExpertise || []).filter(Boolean) : undefined,
        coachVerificationStatus: role === 'coach' ? 'unverified' : undefined,
        createdAt: new Date()
      };

      // Save user
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      persist(STORAGE_KEYS.USERS, updatedUsers);

      // Save auth
      const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
      auth[email] = password;
      persist(STORAGE_KEYS.AUTH, auth);

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'facebook', role: string = 'player'): Promise<{ success: boolean; message?: string }> => {
    try {
      localStorage.setItem(STORAGE_KEYS.OAUTH_ROLE, role);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/sign-in`,
        },
      });

      if (error) {
        localStorage.removeItem(STORAGE_KEYS.OAUTH_ROLE);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error: any) {
      localStorage.removeItem(STORAGE_KEYS.OAUTH_ROLE);
      return { success: false, message: error?.message || 'Social sign-in failed' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    supabase.auth.signOut();
  };

  const addCourt = async (court: Omit<Court, 'id'>) => {
    const newCourt = { ...court, id: Math.random().toString(36).substr(2, 9) };
    const updatedCourts = [...courts, newCourt];
    setCourts(updatedCourts);
    persist(STORAGE_KEYS.COURTS, updatedCourts);
  };

  const updateCourt = async (id: string, updates: Partial<Court>) => {
    const updatedCourts = courts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCourts(updatedCourts);
    persist(STORAGE_KEYS.COURTS, updatedCourts);
  };

  const deleteCourt = async (id: string) => {
    const updatedCourts = courts.filter((c) => c.id !== id);
    setCourts(updatedCourts);
    persist(STORAGE_KEYS.COURTS, updatedCourts);
  };

  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const bookingData = {
      ...booking,
      status: booking.status || 'pending',
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      // Ensure date is stored as ISO string
      date: booking.date instanceof Date ? booking.date.toISOString() : booking.date,
    };

    const newBooking = {
      ...bookingData,
      date: new Date(bookingData.date),
      createdAt: new Date(bookingData.createdAt),
    };
    
    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);

    // Generate Notifications based on roles
    const newNotifications: any[] = [];

    // 1. Notify the user who booked (Player)
    newNotifications.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: bookingData.userId,
      title: 'Booking Request Sent',
      message: `Your booking request for ${format(new Date(bookingData.date), 'MMM dd')} at ${bookingData.startTime} is pending approval.`,
      type: 'info',
      read: false,
      createdAt: new Date(),
    });

    // 2. Notify Admins and Staff
    users.forEach((u) => {
      if ((u.role === 'admin' || u.role === 'staff') && u.id !== bookingData.userId) {
        newNotifications.push({
          id: Math.random().toString(36).substr(2, 9),
          userId: u.id,
          title: 'New Booking Request',
          message: `New booking request received for ${format(new Date(bookingData.date), 'MMM dd')} at ${bookingData.startTime}.`,
          type: 'info',
          read: false,
          createdAt: new Date(),
        });
      }
    });

    setNotifications((prev) => [...newNotifications, ...prev]);
    return bookingData.id;
  };

  const cancelBooking = async (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    const updatedBookings = bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b));
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);

    if (booking) {
      const newNotifications: any[] = [];

      // 1. Notify the user (Player)
      newNotifications.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: booking.userId,
        title: 'Session Cancelled',
        message: `Your session on ${format(booking.date, 'MMM dd')} at ${booking.startTime} has been cancelled.`,
        type: 'warning',
        read: false,
        createdAt: new Date(),
      });

      // 2. Notify Admins and Staff
      users.forEach((u) => {
        if ((u.role === 'admin' || u.role === 'staff') && u.id !== booking.userId) {
          newNotifications.push({
            id: Math.random().toString(36).substr(2, 9),
            userId: u.id,
            title: 'Booking Cancelled',
            message: `Booking on ${format(booking.date, 'MMM dd')} has been cancelled.`,
            type: 'warning',
            read: false,
            createdAt: new Date(),
          });
        }
      });

      setNotifications((prev) => [...newNotifications, ...prev]);
    }
  };

  const confirmBooking = async (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    const updatedBookings = bookings.map((b) => (b.id === id ? { ...b, status: 'confirmed' as const } : b));
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);

    // Notify the user
    const notification: any = {
      id: Math.random().toString(36).substr(2, 9),
      userId: booking.userId,
      title: 'Booking Approved',
      message: `Your booking for ${format(booking.date, 'MMM dd')} at ${booking.startTime} has been approved.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    const updatedBookings = bookings.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);
  };

  const checkInBooking = async (id: string) => {
    const now = new Date();
    const updatedBookings = bookings.map((b) =>
      b.id === id ? { ...b, checkedIn: true, checkedInAt: now } : b
    );
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);
  };

  const markStudentAttendance = async (bookingId: string, studentId: string, attended: boolean) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const newAttendance = { ...(booking.playerAttendance || {}), [studentId]: attended };
    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, playerAttendance: newAttendance } : b);
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);
  };

  const getAvailableSlots = (courtId: string, date: Date, bookingType: BookingType = 'private'): string[] => {
    const court = courts.find((c) => c.id === courtId);
    if (!court) return [];

    const slots: string[] = [];
    const [startHour, startMin] = court.operatingHours.start.split(':').map(Number);
    const [endHour, endMin] = court.operatingHours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      // Find all active bookings for this slot
      const slotBookings = bookings.filter(
        (b) =>
          b.courtId === courtId &&
          isSameDay(b.date, date) &&
          b.status !== 'cancelled' &&
          b.startTime === timeStr
      );

      let isAvailable = true;

      if (slotBookings.length > 0) {
        // If any private/training booking exists, slot is blocked
        const hasExclusiveBooking = slotBookings.some(b => b.type === 'private' || b.type === 'training');
        
        if (hasExclusiveBooking) {
          isAvailable = false;
        } else if (bookingType === 'private' || bookingType === 'training') {
          // Cannot book private if any open play exists
          isAvailable = false;
        } else {
          // Requesting open play, check capacity (default 4 for now)
          const totalPlayers = slotBookings.reduce((acc, b) => acc + 1 + (b.players?.length || 0), 0);
          if (totalPlayers >= 4) isAvailable = false;
        }
      }

      if (isAvailable) {
        slots.push(timeStr);
      }

      currentMin += config.bookingInterval;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin -= 60;
      }
    }

    return slots;
  };

  const getBookingAnalytics = (startDate: Date, endDate: Date): BookingAnalytics => {
    const filtered = bookings.filter(
      (b) => b.date >= startDate && b.date <= endDate
    );

    const totalBookings = filtered.length;
    const completedBookings = filtered.filter((b) => b.status === 'completed').length;
    const cancelledBookings = filtered.filter((b) => b.status === 'cancelled').length;
    const noShows = filtered.filter((b) => b.status === 'no_show').length;
    const totalRevenue = filtered.reduce((sum, b) => sum + b.amount, 0);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShows,
      noShowRate: totalBookings > 0 ? (noShows / totalBookings) * 100 : 0,
      totalRevenue,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    };
  };

  const getCourtUtilization = (
    courtId: string,
    startDate: Date,
    endDate: Date
  ): CourtUtilization[] => {
    const results: CourtUtilization[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayBookings = bookings.filter(
        (b) =>
          b.courtId === courtId &&
          isSameDay(b.date, currentDate) &&
          b.status !== 'cancelled'
      );

      const hoursBooked = dayBookings.reduce((sum, b) => sum + b.duration / 60, 0);
      const revenue = dayBookings.reduce((sum, b) => sum + b.amount, 0);

      const court = courts.find((c) => c.id === courtId);
      const hoursAvailable = court ? 14 : 0; // Assuming 14 hour day

      results.push({
        courtId,
        date: currentDate,
        hoursBooked,
        hoursAvailable,
        utilizationRate: hoursAvailable > 0 ? (hoursBooked / hoursAvailable) * 100 : 0,
        revenue,
      });

      currentDate = addDays(currentDate, 1);
    }

    return results;
  };

  const updateConfig = (updates: Partial<FacilityConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setCurrentUser(updatedUser);
    setUsers(updatedUsers);
    
    // Persist to local storage so it survives refresh
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    persist(STORAGE_KEYS.USERS, updatedUsers);
  };

  const adminUpdateUser = async (id: string, updates: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setUsers(updatedUsers);
    persist(STORAGE_KEYS.USERS, updatedUsers);
  };

  const adminDeleteUser = async (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    persist(STORAGE_KEYS.USERS, updatedUsers);
  };

  const addMembership = async (membership: Omit<MembershipPlan, 'id'>) => {
    const newPlan = { ...membership, id: Math.random().toString(36).substr(2, 9) };
    const updatedMemberships = [...memberships, newPlan];
    setMemberships(updatedMemberships);
    persist(STORAGE_KEYS.MEMBERSHIPS, updatedMemberships);
  };

  const updateMembership = async (id: string, updates: Partial<MembershipPlan>) => {
    const updatedMemberships = memberships.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMemberships(updatedMemberships);
    persist(STORAGE_KEYS.MEMBERSHIPS, updatedMemberships);
  };

  const deleteMembership = async (id: string) => {
    const updatedMemberships = memberships.filter((m) => m.id !== id);
    setMemberships(updatedMemberships);
    persist(STORAGE_KEYS.MEMBERSHIPS, updatedMemberships);
  };

  const subscribe = async (planId: string) => {
    if (!currentUser) throw new Error('You must be logged in to subscribe.');

    // 1. Simulate Payment Processing Delay (e.g., Stripe/PayPal)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const plan = memberships.find(m => m.id === planId);
    if (!plan) throw new Error('Invalid plan selected.');

    // 2. Calculate Subscription Period
    const startDate = new Date();
    const endDate = new Date();
    if (plan.interval === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // 3. Record Subscription in Database
    const newSub: UserSubscription = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      membership_id: planId,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      amount_paid: plan.price,
      created_at: new Date().toISOString()
    };

    const allSubs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS) || '[]');
    persist(STORAGE_KEYS.SUBSCRIPTIONS, [...allSubs, newSub]);
    
    setUserSubscription(newSub);
    setSubscriptionHistory(prev => [newSub, ...prev]);
  };

  const markAllNotificationsAsRead = () => {
    if (currentUser) {
      setNotifications((prev) =>
        prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
      );
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    // Mock reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Password reset instructions sent to your email (Mock).' };
  };

  const joinSession = async (bookingId: string) => {
    if (!currentUser) throw new Error('Must be logged in to join a session');

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Session not found');

    const currentPlayers = booking.players || [];
    if (currentPlayers.includes(currentUser.id)) throw new Error('You have already joined this session');
    if (currentPlayers.length >= (booking.maxPlayers || 4)) throw new Error('Session is full');

    const updatedPlayers = [...currentPlayers, currentUser.id];

    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, players: updatedPlayers } : b);
    setBookings(updatedBookings);
    persist(STORAGE_KEYS.BOOKINGS, updatedBookings);
      
    // Notify the session owner (e.g. Coach)
    const notification: any = {
      id: Math.random().toString(36).substr(2, 9),
      userId: booking.userId,
      title: 'New Player Joined',
      message: `${currentUser.name} has joined your session on ${format(booking.date, 'MMM dd')} at ${booking.startTime}.`,
      type: 'info',
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [notification, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        courts,
        bookings,
        config,
        memberships,
        userSubscription,
        subscriptionHistory,
        notifications,
        login,
        signup,
        signInWithProvider,
        logout,
        addCourt,
        updateCourt,
        deleteCourt,
        createBooking,
        cancelBooking,
        confirmBooking,
        updateBooking,
        checkInBooking,
        getAvailableSlots,
        markStudentAttendance,
        getBookingAnalytics,
        getCourtUtilization,
        updateConfig,
        updateUser,
        adminUpdateUser,
        adminDeleteUser,
        addMembership,
        updateMembership,
        deleteMembership,
        subscribe,
        markAllNotificationsAsRead,
        resetPassword,
        joinSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
