import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import SchedulesPage from './pages/SchedulesPage';
import VehiclesPage from './pages/VehiclesPage';
import BillingPage from './pages/BillingPage';

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
