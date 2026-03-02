import { Booking, Court, FacilityConfig, MembershipPlan, Notification, User } from "@/types";
import { BookingAnalytics, CourtUtilization } from "@/types";

type Role = User["role"];

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: Record<string, unknown> | null;
  error?: { code?: string; message?: string; details?: Record<string, unknown> } | null;
};

type ApiSession = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};

const SESSION_KEY = "ventra_api_session";
const rawUseBackend = String(import.meta.env.VITE_USE_BACKEND_API || "").trim().toLowerCase();
const USE_BACKEND_API = rawUseBackend === "true" || rawUseBackend === "1" || rawUseBackend === "yes";
const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

const mapUser = (u: any): User => ({
  id: String(u?.id || ""),
  email: String(u?.email || ""),
  name: String(u?.name || ""),
  role: (u?.role || "player") as Role,
  phone: String(u?.phone || ""),
  avatar: String(u?.avatar || ""),
  skillLevel: u?.skillLevel,
  coachProfile: u?.coachProfile,
  coachExpertise: Array.isArray(u?.coachExpertise) ? u.coachExpertise : [],
  coachVerificationStatus: u?.coachVerificationStatus,
  coachVerificationMethod: u?.coachVerificationMethod,
  coachVerificationDocumentName: u?.coachVerificationDocumentName,
  coachVerificationId: u?.coachVerificationId,
  coachVerificationNotes: u?.coachVerificationNotes,
  coachVerificationSubmittedAt: u?.coachVerificationSubmittedAt,
  createdAt: new Date(u?.createdAt || Date.now()),
});

const mapCourt = (c: any): Court => ({
  id: String(c?.id || ""),
  name: String(c?.name || ""),
  courtNumber: String(c?.courtNumber || ""),
  type: c?.type || "indoor",
  surfaceType: c?.surfaceType || "hardcourt",
  hourlyRate: Number(c?.hourlyRate || 0),
  peakHourRate: c?.peakHourRate == null ? undefined : Number(c.peakHourRate),
  status: c?.status || "active",
  operatingHours: {
    start: String(c?.operatingHours?.start || "07:00"),
    end: String(c?.operatingHours?.end || "22:00"),
  },
});

const mapBooking = (b: any): Booking => ({
  id: String(b?.id || ""),
  courtId: String(b?.courtId || ""),
  userId: String(b?.userId || ""),
  type: b?.type || "private",
  date: new Date(b?.date || Date.now()),
  startTime: String(b?.startTime || ""),
  endTime: String(b?.endTime || ""),
  duration: Number(b?.duration || 0),
  status: b?.status || "pending",
  paymentStatus: b?.paymentStatus || "unpaid",
  amount: Number(b?.amount || 0),
  players: Array.isArray(b?.players) ? b.players : [],
  maxPlayers: b?.maxPlayers == null ? undefined : Number(b.maxPlayers),
  coachId: b?.coachId || undefined,
  checkedIn: Boolean(b?.checkedIn),
  checkedInAt: b?.checkedInAt ? new Date(b.checkedInAt) : undefined,
  notes: b?.notes || undefined,
  playerAttendance: b?.attendance || b?.playerAttendance || undefined,
  createdAt: new Date(b?.createdAt || Date.now()),
});

const mapPlan = (p: any): MembershipPlan => ({
  id: String(p?.id || ""),
  name: String(p?.name || ""),
  price: Number(p?.price || 0),
  interval: p?.interval === "year" ? "year" : "month",
  tier: p?.tier || "basic",
  description: String(p?.description || ""),
  features: Array.isArray(p?.features) ? p.features.map((f: unknown) => String(f)) : [],
});

const mapNotification = (n: any): Notification => ({
  id: String(n?.id || ""),
  userId: String(n?.userId || ""),
  type: (n?.type || "admin_alert") as Notification["type"],
  title: String(n?.title || ""),
  message: String(n?.message || ""),
  read: Boolean(n?.read),
  createdAt: new Date(n?.createdAt || Date.now()),
});

const mapConfig = (cfg: any): FacilityConfig => ({
  openingTime: String(cfg?.openingTime || "07:00"),
  closingTime: String(cfg?.closingTime || "22:00"),
  bookingInterval: Number(cfg?.bookingInterval || 60),
  bufferTime: Number(cfg?.bufferTime || 15),
  maxBookingDuration: Number(cfg?.maxBookingDuration || 120),
  advanceBookingDays: Number(cfg?.advanceBookingDays || 7),
  cancellationCutoffHours: Number(cfg?.cancellationCutoffHours || 24),
  peakHours: Array.isArray(cfg?.peakHours)
    ? cfg.peakHours.map((p: any) => ({
        start: String(p?.start || "08:00"),
        end: String(p?.end || "12:00"),
      }))
    : [
        { start: "17:00", end: "21:00" },
        { start: "08:00", end: "12:00" },
      ],
  maintenanceMode: Boolean(cfg?.maintenanceMode),
});

const readSession = (): ApiSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.user) return null;
    return {
      accessToken: String(parsed.accessToken),
      refreshToken: parsed.refreshToken ? String(parsed.refreshToken) : undefined,
      user: mapUser(parsed.user),
    };
  } catch {
    return null;
  }
};

const writeSession = (session: ApiSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    }),
  );
};

const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> => {
  const session = readSession();
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.auth !== false && session?.accessToken) {
    headers.authorization = `Bearer ${session.accessToken}`;
    headers["x-user-id"] = session.user.id;
    headers["x-user-role"] = session.user.role;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || "Request failed.";
    throw new Error(message);
  }
  return payload.data;
};

const ensureBackendEnabled = () => {
  if (!USE_BACKEND_API) {
    throw new Error("Backend API mode is disabled.");
  }
};

export const backendApi = {
  isEnabled: USE_BACKEND_API,
  getSession: readSession,
  clearSession: () => writeSession(null),

  async login(email: string, password: string, expectedRole?: Role) {
    ensureBackendEnabled();
    const data = await request<any>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password, expectedRole },
    });
    const session: ApiSession = {
      accessToken: String(data?.accessToken || ""),
      refreshToken: data?.refreshToken ? String(data.refreshToken) : undefined,
      user: mapUser(data?.user || {}),
    };
    writeSession(session);
    return session.user;
  },

  async signup(email: string, password: string, role: Role = "player") {
    ensureBackendEnabled();
    const data = await request<any>("/auth/signup", {
      method: "POST",
      auth: false,
      body: { email, password, role },
    });
    return mapUser(data);
  },

  async logout() {
    if (!USE_BACKEND_API) return;
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      writeSession(null);
    }
  },

  async resetPassword(email: string) {
    ensureBackendEnabled();
    return await request<{ sent: boolean; message?: string }>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { email },
    });
  },

  async oauthStart(provider: "google" | "facebook", expectedRole: Role, redirectUri?: string) {
    ensureBackendEnabled();
    return await request<{ provider: string; expectedRole: string; redirectUrl: string }>("/auth/oauth/start", {
      method: "POST",
      auth: false,
      body: {
        provider,
        expectedRole,
        redirectUri,
      },
    });
  },

  async getUsers(role: Role) {
    ensureBackendEnabled();
    if (role === "admin" || role === "staff") {
      const data = await request<any[]>("/admin/users?page=1&limit=200");
      return data.map(mapUser);
    }
    const me = await request<any>("/users/me");
    const coaches = await request<any[]>("/coaches");
    const users = [mapUser(me), ...coaches.map(mapUser)];
    const unique = new Map<string, User>();
    for (const user of users) unique.set(user.id, user);
    return Array.from(unique.values());
  },

  async getCourts() {
    ensureBackendEnabled();
    const data = await request<any[]>("/courts");
    return data.map(mapCourt);
  },

  async getBookings() {
    ensureBackendEnabled();
    const data = await request<any[]>("/bookings");
    return data.map(mapBooking);
  },

  async getPlans() {
    ensureBackendEnabled();
    const data = await request<any[]>("/plans");
    return data.map(mapPlan);
  },

  async addCourt(court: Omit<Court, "id">) {
    ensureBackendEnabled();
    const data = await request<any>("/courts", {
      method: "POST",
      body: court,
    });
    return mapCourt(data);
  },

  async updateCourt(id: string, updates: Partial<Court>) {
    ensureBackendEnabled();
    const data = await request<any>(`/courts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: updates,
    });
    return mapCourt(data);
  },

  async deleteCourt(id: string) {
    ensureBackendEnabled();
    await request(`/courts/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async adminUpdateUser(id: string, updates: Partial<User>) {
    ensureBackendEnabled();
    const data = await request<any>(`/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: updates,
    });
    return mapUser(data);
  },

  async adminDeleteUser(id: string) {
    ensureBackendEnabled();
    await request(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async addPlan(plan: Omit<MembershipPlan, "id">) {
    ensureBackendEnabled();
    const data = await request<any>("/plans", {
      method: "POST",
      body: plan,
    });
    return mapPlan(data);
  },

  async updatePlan(id: string, updates: Partial<MembershipPlan>) {
    ensureBackendEnabled();
    const data = await request<any>(`/plans/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: updates,
    });
    return mapPlan(data);
  },

  async deletePlan(id: string) {
    ensureBackendEnabled();
    await request(`/plans/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async updateMe(updates: Partial<User>) {
    ensureBackendEnabled();
    const data = await request<any>("/users/me", {
      method: "PATCH",
      body: updates,
    });
    return mapUser(data);
  },

  async getNotifications() {
    ensureBackendEnabled();
    const data = await request<any[]>("/notifications?page=1&limit=200");
    return data.map(mapNotification);
  },

  async getConfig() {
    ensureBackendEnabled();
    const data = await request<any>("/config/facility", { auth: false });
    return mapConfig(data);
  },

  async updateConfig(updates: Partial<FacilityConfig>) {
    ensureBackendEnabled();
    const data = await request<any>("/config/facility", {
      method: "PATCH",
      body: updates,
    });
    return mapConfig(data);
  },

  async createBooking(payload: Omit<Booking, "id" | "createdAt">) {
    ensureBackendEnabled();
    const data = await request<any>("/bookings", {
      method: "POST",
      body: {
        courtId: payload.courtId,
        userId: payload.userId,
        type: payload.type,
        date: payload.date instanceof Date ? payload.date.toISOString().slice(0, 10) : String(payload.date),
        startTime: payload.startTime,
        endTime: payload.endTime,
        duration: payload.duration,
        amount: payload.amount,
        notes: payload.notes,
        coachId: payload.coachId,
      },
    });
    return mapBooking(data);
  },

  async cancelBooking(id: string) {
    ensureBackendEnabled();
    const data = await request<any>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST" });
    return mapBooking(data);
  },

  async confirmBooking(id: string) {
    ensureBackendEnabled();
    const data = await request<any>(`/bookings/${encodeURIComponent(id)}/approve`, { method: "POST" });
    return mapBooking(data);
  },

  async updateBooking(id: string, updates: Partial<Booking>) {
    ensureBackendEnabled();
    const payload: Record<string, unknown> = { ...updates };
    if (updates.date instanceof Date) payload.date = updates.date.toISOString().slice(0, 10);
    const data = await request<any>(`/bookings/${encodeURIComponent(id)}`, { method: "PATCH", body: payload });
    return mapBooking(data);
  },

  async checkInBooking(bookingId: string) {
    ensureBackendEnabled();
    const session = readSession();
    const verify = await request<any>("/check-in/verify", {
      method: "POST",
      body: { bookingId },
    });
    if (!verify?.id) throw new Error("Booking not found.");
    const data = await request<any>("/check-in/confirm", {
      method: "POST",
      body: { bookingId, checkedInBy: session?.user?.id || "" },
    });
    return mapBooking(data);
  },

  async markAllNotificationsAsRead() {
    ensureBackendEnabled();
    await request("/notifications/mark-all-read", { method: "POST" });
  },

  async joinSession(bookingId: string) {
    ensureBackendEnabled();
    const data = await request<any>(`/sessions/${encodeURIComponent(bookingId)}/join`, { method: "POST" });
    return mapBooking(data);
  },

  async markStudentAttendance(bookingId: string, studentId: string, attended: boolean) {
    ensureBackendEnabled();
    const data = await request<any>(`/coach/sessions/${encodeURIComponent(bookingId)}/attendance`, {
      method: "POST",
      body: { playerId: studentId, attended },
    });
    return mapBooking(data);
  },

  async subscribe(planId: string, paymentMethod = "card") {
    ensureBackendEnabled();
    return await request<any>("/subscriptions", {
      method: "POST",
      body: { planId, paymentMethod },
    });
  },

  async getSubscriptionsMe() {
    ensureBackendEnabled();
    const data = await request<any[]>("/subscriptions/me");
    return Array.isArray(data) ? data : [];
  },

  async getAvailableSlots(courtId: string, date: Date, bookingType: "open_play" | "private" | "training" = "private") {
    ensureBackendEnabled();
    const yyyyMmDd = date.toISOString().slice(0, 10);
    const params = new URLSearchParams({
      courtId,
      date: yyyyMmDd,
      bookingType,
    });
    const data = await request<any[]>(`/bookings/available-slots?${params.toString()}`);
    return Array.isArray(data) ? data.map((slot) => String(slot)) : [];
  },

  async getBookingAnalytics(
    startDate: Date,
    endDate: Date,
    filters: { courtId?: string; status?: string; type?: "open_play" | "private" | "training" } = {},
  ): Promise<BookingAnalytics> {
    ensureBackendEnabled();
    const params = new URLSearchParams({
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });
    if (filters.courtId) params.set("courtId", filters.courtId);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    const data = await request<any>(`/analytics/bookings?${params.toString()}`);
    const totalBookings = Number(data?.totalBookings || 0);
    const completedBookings = Number(data?.completedBookings || 0);
    const cancelledBookings = Number(data?.cancelledBookings || 0);
    const noShows = Number(data?.noShows || 0);
    const totalRevenue = Number(data?.totalRevenue || 0);
    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShows,
      noShowRate: totalBookings > 0 ? (noShows / totalBookings) * 100 : 0,
      totalRevenue,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    };
  },

  async getCourtUtilization(courtId: string, startDate: Date, endDate: Date): Promise<CourtUtilization[]> {
    ensureBackendEnabled();
    const params = new URLSearchParams({
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });
    const data = await request<any>(`/analytics/courts/${encodeURIComponent(courtId)}/utilization?${params.toString()}`);
    const hoursBooked = Number(data?.hoursBooked || 0);
    const hoursAvailable = Number(data?.hoursAvailable || 0);
    const utilizationRate =
      data?.utilizationRate == null
        ? hoursAvailable > 0
          ? (hoursBooked / hoursAvailable) * 100
          : 0
        : Number(data.utilizationRate || 0);
    return [
      {
        courtId,
        date: endDate,
        hoursBooked,
        hoursAvailable,
        utilizationRate,
        revenue: 0,
      },
    ];
  },

  async exportBookingsCsv(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    courtId?: string;
    type?: string;
  }) {
    ensureBackendEnabled();
    const params = new URLSearchParams({ format: "csv" });
    if (filters.startDate) params.set("startDate", filters.startDate.toISOString().slice(0, 10));
    if (filters.endDate) params.set("endDate", filters.endDate.toISOString().slice(0, 10));
    if (filters.status) params.set("status", filters.status);
    if (filters.courtId) params.set("courtId", filters.courtId);
    if (filters.type) params.set("type", filters.type);
    const payload = await request<any>(`/analytics/bookings/export?${params.toString()}`);
    return {
      filename: String(payload?.filename || "bookings_export.csv"),
      csv: String(payload?.data || ""),
    };
  },

  async adminExportData() {
    ensureBackendEnabled();
    const payload = await request<any>("/admin/data/export");
    return {
      filename: String(payload?.filename || `ventra-backup-${new Date().toISOString().slice(0, 10)}.json`),
      data: payload?.data ?? {},
    };
  },

  async adminImportData(data: Record<string, unknown>, overwrite = true) {
    ensureBackendEnabled();
    return await request<any>("/admin/data/import", {
      method: "POST",
      body: { overwrite, data },
    });
  },

  async adminResetData() {
    ensureBackendEnabled();
    return await request<any>("/admin/data/reset", {
      method: "POST",
      body: {},
    });
  },
};
