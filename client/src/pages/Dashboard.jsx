// Role-based dashboard router
// Renders the correct dashboard based on user.role — no prop drilling needed

import { useAuth } from '../context/AuthContext.jsx';
import DoctorDashboard from './DoctorDashboard.jsx';
import PatientDashboard from './PatientDashboard.jsx';
import CaretakerDashboard from './CaretakerDashboard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner className="h-64" size="lg" />;

  if (user?.role === 'patient')   return <PatientDashboard />;
  if (user?.role === 'caretaker') return <CaretakerDashboard />;

  // Doctor + admin get the full system view
  return <DoctorDashboard />;
}
