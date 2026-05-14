import { useEffect, useState } from 'react';
import { Heart, Activity, Thermometer, MapPin, Clock, Battery } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePatients } from '../hooks/usePatients.js';
import { usePatientTelemetry } from '../hooks/useTelemetry.js';
import { useAlerts } from '../hooks/useAlerts.js';
import TelemetryChart from '../components/TelemetryChart.jsx';
import { PatientDetailSkeleton } from '../components/Skeletons.jsx';

// Map user.id → patient.id by looking at user_id field on patient records
function resolvePatientId(user, patients) {
  if (!user || !patients.length) return null;
  const linked = patients.find((p) => p.user_id === user.id);
  return linked?.id || 'PD001'; // fallback for demo
}

// Derive status from live telemetry
function deriveStatus(t) {
  if (!t) return null;
  if (t.fall_detected || t.heart_rate > 130 || t.tremor_score > 0.85)
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  if (t.tremor_score > 0.65 || t.heart_rate > 110)
    return { label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  return { label: 'Stable', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
}

// Vital tile component
function VitalTile({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-600">{sub}</p>}
    </div>
  );
}

// "Last updated X sec ago" hook
function useLastUpdated(telemetry) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!telemetry?.created_at) return;
    const update = () => {
      const secs = Math.round((Date.now() - new Date(telemetry.created_at)) / 1000);
      setLabel(secs < 3 ? 'just now' : `${secs}s ago`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [telemetry?.created_at]);
  return label;
}

export default function PatientDashboard() {
  const { user }              = useAuth();
  const { patients, loading } = usePatients();

  const patientId = resolvePatientId(user, patients);
  const { data: chartData, current } = usePatientTelemetry(patientId);
  const { alerts }                   = useAlerts(patientId);
  const lastUpdated                  = useLastUpdated(current);
  const status                       = deriveStatus(current);

  if (loading) return <PatientDetailSkeleton />;

  const hr      = current?.heart_rate    ? `${Math.round(current.heart_rate)} bpm`     : '—';
  const tremor  = current?.tremor_score  != null ? `${(current.tremor_score * 100).toFixed(0)}%` : '—';
  const temp    = current?.temperature   ? `${current.temperature}°C`  : '—';
  const loc     = current?.latitude      ? 'Tracked'                   : 'Awaiting';

  const recentAlerts = alerts.filter((a) => !a.resolved).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* ── Header: Personal Health ────────────────────────────────────── */}
      <div className="text-center pt-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-xl text-white mx-auto mb-3">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
        <p className="text-slate-500 text-sm mt-1">Patient ID: {patientId}</p>

        {/* Status badge */}
        {status && (
          <span className={`inline-flex items-center gap-1.5 mt-3 text-sm font-semibold px-4 py-1.5 rounded-full border ${status.color} ${status.bg} ${status.border}`}>
            <span className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')} ${status.label !== 'Stable' ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 mt-2">
            <Clock className="w-3 h-3" />
            Updated {lastUpdated}
          </div>
        )}
      </div>

      {/* ── Fall alert ─────────────────────────────────────────────────── */}
      {current?.fall_detected && (
        <div className="glass-card p-4 border border-red-500/40 sos-ring flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">Fall Detected!</p>
            <p className="text-xs text-red-400/70">Your caretaker has been notified. Please stay safe.</p>
          </div>
        </div>
      )}

      {/* ── Live Vitals ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <VitalTile icon={Heart}       label="Heart Rate"    value={hr}     color="text-red-400"   sub="Beats per minute" />
        <VitalTile icon={Activity}    label="Tremor"        value={tremor} color="text-amber-400" sub="Motor activity score" />
        <VitalTile icon={Thermometer} label="Temperature"   value={temp}   color="text-blue-400"  sub="Body surface temp" />
        <VitalTile icon={MapPin}      label="Location"      value={loc}    color="text-green-400" sub="GPS tracking" />
      </div>

      {/* ── Personal Trend Chart ───────────────────────────────────────── */}
      <div className="glass-card p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white text-sm">Your Health Trend</h2>
            <p className="text-xs text-slate-500">Last 30 readings · updating live</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="live-dot" />Live
          </span>
        </div>
        {chartData.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Waiting for readings…</p>
        ) : (
          <TelemetryChart data={chartData} />
        )}
      </div>

      {/* ── Personal Alerts ────────────────────────────────────────────── */}
      {recentAlerts.length > 0 && (
        <div className="glass-card p-5 border border-white/5">
          <h2 className="font-semibold text-white text-sm mb-3">Recent Notifications</h2>
          <div className="space-y-2">
            {recentAlerts.map((alert, i) => (
              <div key={alert.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <span className={`badge-${alert.severity} shrink-0 mt-0.5`}>{alert.severity}</span>
                <div>
                  <p className="text-xs text-slate-300">{alert.message}</p>
                  {alert.created_at && (
                    <p className="text-xs text-slate-600 mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Health tip ─────────────────────────────────────────────────── */}
      <div className="glass-card p-5 border border-purple-500/15 bg-purple-500/5">
        <p className="text-xs text-purple-400/80 font-medium mb-1">💡 Daily Reminder</p>
        <p className="text-sm text-slate-300">Take your medication at the same time each day. Regular exercise helps manage tremor symptoms.</p>
      </div>
    </div>
  );
}
