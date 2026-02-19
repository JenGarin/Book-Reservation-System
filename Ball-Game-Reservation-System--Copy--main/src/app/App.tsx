import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import { Login } from './components/Login';
import { RoleSelection } from './components/RoleSelection';
import { SignUp } from './components/SignUp';
import { ForgotPassword } from './components/ForgotPassword';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BookingInterface } from './components/BookingInterface';
import { MyBookings } from './components/MyBookings';
import { CourtManagementView } from './components/CourtManagementView';
import { Reports } from './components/Reports';
import { ProfileSettings } from './components/ProfileSettings';
import Pricing from './components/Pricing';
import { CheckIn } from './components/CheckIn';
import { UserPortalView } from './components/UserPortalView';
import { NotificationsView } from './components/NotificationsView';
import { UserManagementView } from './components/UserManagementView';
import { SettingsView } from './components/SettingsView';
import { PaymentHistory } from './components/PaymentHistory';
import { CoachSessions } from './components/CoachSessions';

function DashboardLayout() {
  const { currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const currentView = location.pathname.split('/')[1] || 'dashboard';

  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
  };

  return (
    <div className="flex min-h-screen bg-[#1F3A3C] transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        role={currentUser.role as any} 
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function DashboardHome() {
  const { currentUser } = useApp();
  return (currentUser?.role === 'admin' || currentUser?.role === 'staff') ? <DashboardView /> : <UserPortalView />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<RoleSelection />} />
            <Route path="/sign-in" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/booking" element={<BookingInterface />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/court-mgmt" element={<CourtManagementView />} />
              <Route path="/analytics" element={<Reports />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/users" element={<UserManagementView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/billing" element={<PaymentHistory />} />
              <Route path="/coach-sessions" element={<CoachSessions />} />
            </Route>

            <Route path="/check-in" element={<CheckIn />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
