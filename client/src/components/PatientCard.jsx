import { useNavigate } from 'react-router-dom';
import { Heart, Activity, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const stageLabels = ['', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Stage V'];
const stageColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-600'];

// Derive patient status from live telemetry
function getPatientStatus(telemetry) {
  if (!telemetry) return null;
  if (telemetry.fall_detected)       return { label: 'Critical', cls: 'status-critical' };
  if (telemetry.heart_rate > 130)    return { label: 'Critical', cls: 'status-critical' };
  if (telemetry.tremor_score > 0.75) return { label: 'Warning',  cls: 'status-warning' };
  if (telemetry.heart_rate > 110)    return { label: 'Warning',  cls: 'status-warning' };
  return { label: 'Stable', cls: 'status-stable' };
}

// "Updated X sec ago"
function useLastUpdated(telemetry) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!telemetry?.created_at) return;
    const update = () => {
      const secs = Math.round((Date.now() - new Date(telemetry.created_at)) / 1000);
      setLabel(secs < 5 ? 'just now' : `${secs}s ago`);
    };
    update();
    const t = setInterval(update, 2000);
    return () => clearInterval(t);
  }, [telemetry?.created_at]);
  return label;
}

export default function PatientCard({ patient, telemetry }) {
  const navigate  = useNavigate();
  const hasFall   = telemetry?.fall_detected;
  const status    = getPatientStatus(telemetry);
  const lastUpdated = useLastUpdated(telemetry);

  return (
    <div
      onClick={() => navigate(`/patients/${patient.id}`)}
      className={`glass-card p-5 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/30 border
        ${hasFall ? 'border-red-500/40 sos-ring' : 'border-white/5'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
          {patient.avatar_initials || patient.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white text-sm truncate">{patient.name}</p>
          <p className="text-xs text-slate-500">Age {patient.age} · {stageLabels[patient.diagnosis_stage] || 'Unknown'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold ${stageColors[patient.diagnosis_stage] || 'text-slate-400'}`}>
            {stageLabels[patient.diagnosis_stage] || '—'}
          </span>
          {status && <span className={status.cls}>{status.label}</span>}
        </div>
      </div>

      {/* Live Vitals */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-slate-300">
            {telemetry?.heart_rate ? `${Math.round(telemetry.heart_rate)} bpm` : '— bpm'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-300">
            {telemetry?.tremor_score != null ? `${(telemetry.tremor_score * 100).toFixed(0)}% tremor` : '—'}
          </span>
        </div>
      </div>

      {/* Fall alert badge */}
      {hasFall && (
        <div className="mt-3 flex items-center gap-1.5 text-red-400 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          Fall detected — Assistance needed
        </div>
      )}

      {/* Footer: Patient ID + last updated */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-600 font-mono">{patient.id}</p>
        {lastUpdated && telemetry && (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Clock className="w-3 h-3" />
            {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
}
