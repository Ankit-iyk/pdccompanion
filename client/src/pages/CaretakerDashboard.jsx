import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Phone, ShieldAlert, Activity, Heart, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePatients } from '../hooks/usePatients.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useLiveTelemetry } from '../hooks/useTelemetry.js';
import { useSocket } from '../context/SocketContext.jsx';
import TelemetryChart from '../components/TelemetryChart.jsx';
import { DashboardSkeleton } from '../components/Skeletons.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

// Caretaker is assigned to these patients in the seed
// In production this would come from user.assignedPatients on the JWT
const CARETAKER_ASSIGNMENTS = ['PD001', 'PD002'];

const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   age: 68, diagnosis_stage: 2, avatar_initials: 'MT', phone: '+91 98765 43210' },
  { id: 'PD002', name: 'Eleanor Rodriguez', age: 72, diagnosis_stage: 3, avatar_initials: 'ER', phone: '+91 98765 43211' },
  { id: 'PD003', name: 'James Chen',        age: 65, diagnosis_stage: 2, avatar_initials: 'JC', phone: '+91 98765 43212' },
];

function patientSeverity(t) {
  if (!t) return 3;
  if (t.fall_detected || t.heart_rate > 130) return 0;
  if (t.tremor_score > 0.75 || t.heart_rate > 110) return 1;
  return 2;
}

const stageColors = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-orange-400', 4: 'text-red-400', 5: 'text-red-600' };

// ── Patient monitoring card (caretaker version) ───────────────────────────────
function PatientMonitorCard({ patient, telemetry, alerts }) {
  const navigate  = useNavigate();
  const severity  = patientSeverity(telemetry);
  const isCritical = severity === 0;
  const isWarning  = severity === 1;

  const [calling, setCalling] = useState(false);
  const handleCall = (e) => {
    e.stopPropagation();
    setCalling(true);
    toast.success(`📞 Calling ${patient.name}…`, {
      duration: 3000,
      icon: '📞',
      style: { background: '#0f2e1a', borderColor: '#22c55e', color: '#86efac' },
    });
    setTimeout(() => setCalling(false), 3000);
  };

  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length;

  return (
    <div
      onClick={() => navigate(`/patients/${patient.id}`)}
      className={`glass-card p-5 border cursor-pointer transition-all hover:scale-[1.01] ${
        isCritical ? 'border-red-500/40 sos-ring' :
        isWarning  ? 'border-yellow-500/30' :
        'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
          isCritical ? 'bg-red-500' : isWarning ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-primary to-purple-500'
        }`}>
          {patient.avatar_initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{patient.name}</p>
          <p className="text-xs text-slate-500">Age {patient.age} · Stage {patient.diagnosis_stage}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCritical && <span className="badge-critical">Critical</span>}
          {isWarning  && !isCritical && <span className="badge-high">Warning</span>}
          {severity === 2 && <span className="status-stable">Stable</span>}
          {unresolvedAlerts > 0 && (
            <span className="text-xs text-red-400">{unresolvedAlerts} alert{unresolvedAlerts > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Live vitals */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-slate-300">
            {telemetry?.heart_rate ? `${Math.round(telemetry.heart_rate)} bpm` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-300">
            {telemetry?.tremor_score != null ? `${(telemetry.tremor_score * 100).toFixed(0)}% tremor` : '—'}
          </span>
        </div>
      </div>

      {/* Fall alert */}
      {telemetry?.fall_detected && (
        <div className="flex items-center gap-2 mb-3 text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          🚨 FALL DETECTED — Immediate action needed
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleCall}
          disabled={calling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          {calling ? 'Calling…' : 'Call Patient'}
        </button>
        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs font-medium transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ── Alert resolution row ──────────────────────────────────────────────────────
function AlertRow({ alert, onResolve }) {
  const [resolving, setResolving] = useState(false);
  const doResolve = async () => {
    if (!alert.id || resolving) return;
    setResolving(true);
    await onResolve(alert.id);
    toast.success('Alert resolved');
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${
      alert.severity === 'critical'
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-white/5 border-white/5'
    }`}>
      <span className={`badge-${alert.severity} shrink-0 mt-0.5`}>{alert.severity}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-300">{alert.message}</p>
        <p className="text-xs text-slate-600 mt-0.5">{alert.patient_id}</p>
      </div>
      {!alert.resolved && alert.id && (
        <button
          onClick={doResolve}
          disabled={resolving}
          className="shrink-0 flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-40"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {resolving ? '…' : 'Resolve'}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CaretakerDashboard() {
  const { user }               = useAuth();
  const { patients, loading }  = usePatients();
  const { connected }          = useSocket() || {};
  const { latest, history }    = useLiveTelemetry();

  const allPatients    = patients.length ? patients : MOCK_PATIENTS;
  const assignments    = user?.assignedPatients || CARETAKER_ASSIGNMENTS;
  const myPatients     = allPatients.filter((p) => assignments.includes(p.id));
  const displayPatients = myPatients.length ? myPatients : allPatients.slice(0, 2);

  // Alerts only for assigned patients
  const { alerts: alertsPD1, resolve: resolvePD1 } = useAlerts('PD001');
  const { alerts: alertsPD2, resolve: resolvePD2 } = useAlerts('PD002');
  const combinedAlerts = [...alertsPD1, ...alertsPD2]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unresolved = combinedAlerts.filter((a) => !a.resolved);
  const criticalNow = displayPatients.filter((p) => patientSeverity(latest[p.id]) === 0);

  const resolveAlert = async (id) => {
    // Try both resolve functions
    try { await resolvePD1(id); } catch { await resolvePD2(id); }
  };

  const focusedId = displayPatients[0]?.id;
  const chartData = history[focusedId] || [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Care Monitor</h1>
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              connected
                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                : 'text-slate-500 bg-white/5 border-white/10'
            }`}>
              {connected ? <><span className="live-dot" />LIVE</> : '⚠ Offline'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {user?.name} · Monitoring {displayPatients.length} assigned patient{displayPatients.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unresolved.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 sos-ring">
            <Bell className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">{unresolved.length} Active Alerts</span>
          </div>
        )}
      </div>

      {/* ── Critical Alert Banner ─────────────────────────────────────────── */}
      {criticalNow.length > 0 && (
        <div className="glass-card p-4 border border-red-500/40 sos-ring">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 font-bold text-sm">🚨 EMERGENCY — Immediate action required!</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {criticalNow.map((p) => p.name).join(', ')} {criticalNow.length > 1 ? 'require' : 'requires'} assistance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{displayPatients.length}</p>
          <p className="text-xs text-slate-500 mt-1">Assigned Patients</p>
        </div>
        <div className={`glass-card p-4 border text-center ${unresolved.length > 0 ? 'border-red-500/20' : 'border-white/5'}`}>
          <p className={`text-2xl font-bold ${unresolved.length > 0 ? 'text-red-400' : 'text-white'}`}>{unresolved.length}</p>
          <p className="text-xs text-slate-500 mt-1">Unresolved Alerts</p>
        </div>
        <div className={`glass-card p-4 border text-center ${criticalNow.length > 0 ? 'border-red-500/20' : 'border-green-500/20'}`}>
          <p className={`text-2xl font-bold ${criticalNow.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{criticalNow.length}</p>
          <p className="text-xs text-slate-500 mt-1">Critical Now</p>
        </div>
      </div>

      {/* ── Patient cards + Alert Feed ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patient monitor cards */}
        <div className="space-y-4">
          <h2 className="font-semibold text-white text-sm">Assigned Patients</h2>
          {displayPatients.map((p) => (
            <PatientMonitorCard
              key={p.id}
              patient={p}
              telemetry={latest[p.id]}
              alerts={combinedAlerts.filter((a) => a.patient_id === p.id)}
            />
          ))}
        </div>

        {/* Active alerts panel */}
        <div className="glass-card p-5 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Alert Queue</h2>
            {unresolved.length > 0 && (
              <span className="badge-critical animate-pulse">{unresolved.length} pending</span>
            )}
          </div>
          {combinedAlerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-slate-400 text-sm font-medium">All clear!</p>
              <p className="text-xs text-slate-600 mt-1">No active alerts for your patients</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-80 flex-1">
              {combinedAlerts.slice(0, 10).map((alert, i) => (
                <AlertRow key={alert.id || i} alert={alert} onResolve={resolveAlert} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Live trend chart ─────────────────────────────────────────────── */}
      <div className="glass-card p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">
            Live Vitals — {displayPatients[0]?.name || focusedId}
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="live-dot" />Live
          </span>
        </div>
        {chartData.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Waiting for telemetry…</p>
        ) : (
          <TelemetryChart data={chartData} />
        )}
      </div>
    </div>
  );
}
