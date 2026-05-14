import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import PatientDetailsPage from './pages/PatientDetailsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import AIInsightsPage from './pages/AIInsightsPage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner className="h-screen" size="lg" />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner className="h-screen" size="lg" />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SocketProvider>
              <MainLayout />
            </SocketProvider>
          </ProtectedRoute>
        }
      >
        <Route index       element={<Dashboard />} />
        <Route path="patients"         element={<PatientsPage />} />
        <Route path="patients/:id"     element={<PatientDetailsPage />} />
        <Route path="alerts"           element={<AlertsPage />} />
        <Route path="insights"         element={<AIInsightsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
