import { useState } from 'react';
import { Users, Bell, Heart, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePatients } from '../hooks/usePatients.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useLiveTelemetry } from '../hooks/useTelemetry.js';
import StatCard from '../components/StatCard.jsx';
import AlertBanner from '../components/AlertBanner.jsx';
import PatientCard from '../components/PatientCard.jsx';
import TelemetryChart from '../components/TelemetryChart.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

// Fallback mock patients for when DB isn't configured
const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   age: 68, diagnosis_stage: 2, avatar_initials: 'MT' },
  { id: 'PD002', name: 'Eleanor Rodriguez', age: 72, diagnosis_stage: 3, avatar_initials: 'ER' },
  { id: 'PD003', name: 'James Chen',        age: 65, diagnosis_stage: 2, avatar_initials: 'JC' },
];

// ── Emergency Demo Trigger ────────────────────────────────────────────────────
function DemoTrigger({ patients }) {
  const [triggering, setTriggering] = useState(false);
  const [selectedPid, setSelectedPid] = useState(patients[0]?.id || 'PD001');

  const trigger = async () => {
    setTriggering(true);
    try {
      await api.post('/demo/trigger-fall', { patientId: selectedPid });
      toast.error(`🚨 FALL EVENT triggered for ${selectedPid}`, {
        duration: 5000,
        style: { background: '#450a0a', borderColor: '#dc2626', color: '#fca5a5' },
      });
    } catch {
      toast.error('Demo trigger failed — check backend');
    } finally {
      setTimeout(() => setTriggering(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
      <Zap className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-xs text-red-400 font-medium">Demo Mode</span>
      <select
        value={selectedPid}
        onChange={(e) => setSelectedPid(e.target.value)}
        className="ml-auto bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
      >
        {patients.map((p) => (
          <option key={p.id} value={p.id} className="bg-gray-900">{p.name || p.id}</option>
        ))}
      </select>
      <button
        onClick={trigger}
        disabled={triggering}
        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
      >
        {triggering ? '⚡ Triggering…' : '🚨 Trigger Fall'}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user }               = useAuth();
  const { patients, loading }  = usePatients();
  const { unresolved, alerts } = useAlerts();
  const { latest, history }    = useLiveTelemetry();

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;
  const firstPatientId  = displayPatients[0]?.id || 'PD001';
  const chartData       = history[firstPatientId] || [];

  const avgHR = (() => {
    const vals = Object.values(latest).map((t) => t.heart_rate).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '—';
  })();

  const fallsToday = alerts.filter(
    (a) => a.type === 'FALL' && new Date(a.created_at) > new Date(Date.now() - 86400000)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
          </p>
        </div>
      </div>

      {/* SOS Alert Banner */}
      <AlertBanner alerts={unresolved} />

      {/* Demo trigger (hackathon) */}
      <DemoTrigger patients={displayPatients} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients"  value={displayPatients.length}    icon={Users}         color="blue"  sub="Under monitoring" />
        <StatCard label="Active Alerts"   value={unresolved.length}          icon={Bell}          color="red"   sub="Unresolved" pulse={unresolved.length > 0} />
        <StatCard label="Avg Heart Rate"  value={avgHR === '—' ? '—' : `${avgHR}`} icon={Heart} color="amber" sub="Live across patients" />
        <StatCard label="Fall Events"     value={fallsToday}                 icon={AlertTriangle} color={fallsToday > 0 ? 'red' : 'green'} sub="Last 24 hours" />
      </div>

      {/* Live Chart + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white text-sm">Live Telemetry</h2>
              <p className="text-xs text-slate-500">Patient {firstPatientId} · updating every 2s</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="live-dot" />
              Live
            </span>
          </div>
          <TelemetryChart data={chartData} />
        </div>

        <div className="glass-card p-5 border border-white/5">
          <h2 className="font-semibold text-white text-sm mb-4">Recent Alerts</h2>
          {loading ? (
            <LoadingSpinner className="py-8" />
          ) : alerts.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No alerts yet</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-52">
              {alerts.slice(0, 6).map((alert, i) => (
                <div key={alert.id || i} className="flex items-start gap-2 p-3 rounded-xl bg-white/5">
                  <span className={`badge-${alert.severity} shrink-0 mt-0.5`}>{alert.severity}</span>
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
