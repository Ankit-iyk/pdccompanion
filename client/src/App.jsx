import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

// Block access to routes the current role shouldn't see
function RoleRoute({ allow, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
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
        {/* Dashboard — role router, everyone can visit */}
        <Route index element={<Dashboard />} />

        {/* Patients — doctor + caretaker only */}
        <Route
          path="patients"
          element={<RoleRoute allow={['doctor', 'caretaker', 'admin']}><PatientsPage /></RoleRoute>}
        />
        <Route
          path="patients/:id"
          element={<RoleRoute allow={['doctor', 'caretaker', 'admin']}><PatientDetailsPage /></RoleRoute>}
        />

        {/* Alerts — all roles */}
        <Route path="alerts" element={<AlertsPage />} />

        {/* AI Insights — doctor + admin only */}
        <Route
          path="insights"
          element={<RoleRoute allow={['doctor', 'admin']}><AIInsightsPage /></RoleRoute>}
        />
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
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2035',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
