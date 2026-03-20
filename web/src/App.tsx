import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/Toast';
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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route element={<Layout user={user} onLogout={logout} />}>
            <Route path="/" element={<Suspense fallback={<div className="p-8 text-gray-400">로딩 중...</div>}>{isPlatformAdmin ? <PlatformDashboardPage /> : <DashboardPage />}</Suspense>} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/vehicles" element={isPlatformAdmin ? <PlatformVehiclesPage /> : <VehiclesPage />} />
            <Route path="/billing" element={isPlatformAdmin ? <PlatformBillingPage /> : <BillingPage />} />
            {/* Platform admin routes */}
            <Route path="/academies" element={<PlatformAcademiesPage />} />
            <Route path="/users" element={<PlatformUsersPage />} />
            <Route path="/upload" element={<PlatformUploadPage />} />
            <Route path="/compliance" element={<PlatformCompliancePage />} />
            <Route path="/seed" element={<PlatformSeedPage />} />
            <Route path="/audit-logs" element={<PlatformAuditLogPage />} />
            <Route path="/map" element={<Suspense fallback={<div className="p-8 text-gray-400">로딩 중...</div>}><PlatformMapPage /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
