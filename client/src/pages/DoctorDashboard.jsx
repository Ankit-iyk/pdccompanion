import { useState } from 'react';
import { Users, Bell, Heart, AlertTriangle, Zap, Activity, Cpu, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePatients } from '../hooks/usePatients.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useLiveTelemetry } from '../hooks/useTelemetry.js';
import { useSocket } from '../context/SocketContext.jsx';
import StatCard from '../components/StatCard.jsx';
import AlertBanner from '../components/AlertBanner.jsx';
import PatientCard from '../components/PatientCard.jsx';
import TelemetryChart from '../components/TelemetryChart.jsx';
import { DashboardSkeleton } from '../components/Skeletons.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   age: 68, diagnosis_stage: 2, avatar_initials: 'MT' },
  { id: 'PD002', name: 'Eleanor Rodriguez', age: 72, diagnosis_stage: 3, avatar_initials: 'ER' },
  { id: 'PD003', name: 'James Chen',        age: 65, diagnosis_stage: 2, avatar_initials: 'JC' },
];

// Derive patient status from telemetry for severity sorting
function patientSeverity(t) {
  if (!t) return 3;
  if (t.fall_detected || t.heart_rate > 130) return 0;
  if (t.tremor_score > 0.75 || t.heart_rate > 110) return 1;
  return 2;
}

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
      toast.error('Demo trigger failed');
    } finally {
      setTimeout(() => setTriggering(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
      <Zap className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-xs text-red-400 font-medium">Demo</span>
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

export default function DoctorDashboard() {
  const { user }               = useAuth();
  const { patients, loading }  = usePatients();
  const { unresolved, alerts } = useAlerts();
  const { latest, history }    = useLiveTelemetry();
  const { connected }          = useSocket() || {};

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;

  // Sort patients by severity (critical first)
  const sorted = [...displayPatients].sort(
    (a, b) => patientSeverity(latest[a.id]) - patientSeverity(latest[b.id])
  );

  const [chartPatient, setChartPatient] = useState(null);
  const focusedId   = chartPatient || sorted[0]?.id || 'PD001';
  const chartData   = history[focusedId] || [];

  const avgHR = (() => {
    const vals = Object.values(latest).map((t) => t.heart_rate).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '—';
  })();

  const fallsToday = alerts.filter(
    (a) => a.type === 'FALL' && new Date(a.created_at) > new Date(Date.now() - 86400000)
  ).length;

  const criticalCount = sorted.filter((p) => patientSeverity(latest[p.id]) === 0).length;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              connected
                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                : 'text-slate-500 bg-white/5 border-white/10'
            }`}>
              {connected ? <><span className="live-dot" />LIVE</> : '⚠ Offline'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Dr. {user?.name?.split(' ').slice(-1)[0]} · System-wide monitoring · {displayPatients.length} patients
          </p>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-xs text-slate-600 mt-0.5">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* ── SOS Banner ───────────────────────────────────────────────────── */}
      <AlertBanner alerts={unresolved} />

      {/* ── Demo trigger ──────────────────────────────────────────────────── */}
      <DemoTrigger patients={sorted} />

      {/* ── System Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Patients"   value={displayPatients.length}    icon={Users}         color="blue"   sub="Under monitoring" />
        <StatCard label="Active Alerts"    value={unresolved.length}          icon={Bell}          color="red"    sub="Unresolved" pulse={unresolved.length > 0} />
        <StatCard label="Avg Heart Rate"   value={avgHR === '—' ? '—' : `${avgHR}`} icon={Heart}  color="amber"  sub="Live across patients" />
        <StatCard label="Critical Events"  value={`${criticalCount} / ${fallsToday}`} icon={AlertTriangle} color={criticalCount > 0 ? 'red' : 'green'} sub="Critical now / Falls today" />
      </div>

      {/* ── Live Chart + Alert Feed ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white text-sm">Live Telemetry Feed</h2>
              <div className="flex items-center gap-2 mt-1">
                {sorted.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setChartPatient(p.id)}
                    className={`text-xs px-2 py-0.5 rounded-lg border transition-all ${
                      focusedId === p.id
                        ? 'bg-primary/20 border-primary/40 text-primary-light'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                  >
                    {p.avatar_initials || p.id}
                  </button>
                ))}
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="live-dot" />Live · 2s
            </span>
          </div>
          <TelemetryChart data={chartData} />
        </div>

        {/* Alert Feed */}
        <div className="glass-card p-5 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Alert Feed</h2>
            {unresolved.length > 0 && (
              <span className="badge-critical">{unresolved.length} active</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center flex-1">No alerts</p>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 max-h-56">
              {alerts.slice(0, 8).map((alert, i) => (
                <div key={alert.id || i} className={`flex items-start gap-2 p-3 rounded-xl ${
                  alert.severity === 'critical' ? 'bg-red-500/5 border border-red-500/15' : 'bg-white/5'
                }`}>
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

      {/* ── Patient Grid (severity-sorted) ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">Patient Overview</h2>
          <p className="text-xs text-slate-500">Sorted by severity</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((p) => (
            <PatientCard key={p.id} patient={p} telemetry={latest[p.id]} />
          ))}
        </div>
      </div>
    </div>
  );
}
