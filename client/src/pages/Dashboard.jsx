import { Users, Bell, Heart, Activity, AlertTriangle, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePatients } from '../hooks/usePatients.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useLiveTelemetry } from '../hooks/useTelemetry.js';
import StatCard from '../components/StatCard.jsx';
import AlertBanner from '../components/AlertBanner.jsx';
import PatientCard from '../components/PatientCard.jsx';
import TelemetryChart from '../components/TelemetryChart.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// Fallback mock patients for when DB isn't configured
const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   age: 68, diagnosis_stage: 2, avatar_initials: 'MT' },
  { id: 'PD002', name: 'Eleanor Rodriguez', age: 72, diagnosis_stage: 3, avatar_initials: 'ER' },
  { id: 'PD003', name: 'James Chen',        age: 65, diagnosis_stage: 2, avatar_initials: 'JC' },
];

export default function Dashboard() {
  const { user }               = useAuth();
  const { patients, loading }  = usePatients();
  const { unresolved, alerts } = useAlerts();
  const { latest, history }    = useLiveTelemetry();

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;
  const firstPatientId  = displayPatients[0]?.id || 'PD001';
  const chartData       = history[firstPatientId] || [];

  // Aggregate live stats
  const avgHR = (() => {
    const vals = Object.values(latest).map((t) => t.heart_rate).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(0) : '—';
  })();

  const fallsToday = alerts.filter(
    (a) => a.type === 'FALL' && new Date(a.created_at) > new Date(Date.now() - 86400000)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </p>
      </div>

      {/* SOS Alert Banner */}
      <AlertBanner alerts={unresolved} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients"  value={displayPatients.length}      icon={Users}         color="blue"  sub="Under monitoring" />
        <StatCard label="Active Alerts"   value={unresolved.length}            icon={Bell}          color="red"   sub="Unresolved" pulse={unresolved.length > 0} />
        <StatCard label="Avg Heart Rate"  value={avgHR === '—' ? '—' : `${avgHR}`} icon={Heart}    color="amber" sub="Live across patients" />
        <StatCard label="Fall Events"     value={fallsToday}                   icon={AlertTriangle} color={fallsToday > 0 ? 'red' : 'green'} sub="Last 24 hours" />
      </div>

      {/* Live Chart + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 glass-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white text-sm">Live Telemetry</h2>
              <p className="text-xs text-slate-500">Patient {firstPatientId} · updating every 2s</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <TelemetryChart data={chartData} patientId={firstPatientId} />
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-5 border border-white/5">
          <h2 className="font-semibold text-white text-sm mb-4">Recent Alerts</h2>
          {loading ? (
            <LoadingSpinner className="py-8" />
          ) : alerts.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No alerts</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-52">
              {alerts.slice(0, 6).map((alert, i) => (
                <div key={alert.id || i} className="flex items-start gap-2 p-3 rounded-xl bg-white/5">
                  <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{alert.message}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{alert.patient_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Cards */}
      <div>
        <h2 className="font-semibold text-white text-sm mb-4">Patient Overview</h2>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPatients.map((p) => (
              <PatientCard key={p.id} patient={p} telemetry={latest[p.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
