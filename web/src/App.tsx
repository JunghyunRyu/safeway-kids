import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const PlatformDashboardPage = lazy(() => import('./pages/platform/PlatformDashboardPage'));
const PlatformAcademiesPage = lazy(() => import('./pages/platform/PlatformAcademiesPage'));
const PlatformUsersPage = lazy(() => import('./pages/platform/PlatformUsersPage'));
const PlatformUploadPage = lazy(() => import('./pages/platform/PlatformUploadPage'));
const PlatformCompliancePage = lazy(() => import('./pages/platform/PlatformCompliancePage'));
const PlatformSeedPage = lazy(() => import('./pages/platform/PlatformSeedPage'));
const PlatformBillingPage = lazy(() => import('./pages/platform/PlatformBillingPage'));
const PlatformVehiclesPage = lazy(() => import('./pages/platform/PlatformVehiclesPage'));
const PlatformAuditLogPage = lazy(() => import('./pages/platform/PlatformAuditLogPage'));
const PlatformMapPage = lazy(() => import('./pages/platform/PlatformMapPage'));
const PlatformStudentSearchPage = lazy(() => import('./pages/platform/PlatformStudentSearchPage'));
const PlatformNotificationLogsPage = lazy(() => import('./pages/platform/PlatformNotificationLogsPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const PlatformTicketsPage = lazy(() => import('./pages/platform/PlatformTicketsPage'));
const PlatformBoardingStatusPage = lazy(() => import('./pages/platform/PlatformBoardingStatusPage'));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage'));

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  const isPlatformAdmin = user.role === 'platform_admin';

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route element={<Layout user={user} onLogout={logout} />}>
                <Route path="/" element={isPlatformAdmin ? <PlatformDashboardPage /> : <DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/vehicles" element={isPlatformAdmin ? <PlatformVehiclesPage /> : <VehiclesPage />} />
                <Route path="/billing" element={isPlatformAdmin ? <PlatformBillingPage /> : <BillingPage />} />
                {/* Platform admin routes */}
                <Route path="/academies" element={<PlatformAcademiesPage />} />
                <Route path="/users" element={<PlatformUsersPage />} />
                <Route path="/upload" element={<PlatformUploadPage />} />
                <Route path="/compliance" element={<PlatformCompliancePage />} />
                {!import.meta.env.PROD && <Route path="/seed" element={<PlatformSeedPage />} />}
                <Route path="/audit-logs" element={<PlatformAuditLogPage />} />
                <Route path="/map" element={<PlatformMapPage />} />
                <Route path="/student-search" element={<PlatformStudentSearchPage />} />
                <Route path="/notification-logs" element={<PlatformNotificationLogsPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/tickets" element={<PlatformTicketsPage />} />
                <Route path="/boarding-status" element={<PlatformBoardingStatusPage />} />
                <Route path="/monthly-report" element={<MonthlyReportPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
