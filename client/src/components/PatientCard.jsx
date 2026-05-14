import { useNavigate } from 'react-router-dom';
import { Activity, Heart, Cpu, BatteryLow, AlertCircle } from 'lucide-react';

const stageColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-600'];
const stageLabels = ['', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Stage V'];

export default function PatientCard({ patient, telemetry }) {
  const navigate = useNavigate();
  const hasFall = telemetry?.fall_detected;

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
        <span className={`text-xs font-semibold ${stageColors[patient.diagnosis_stage] || 'text-slate-400'}`}>
          {stageLabels[patient.diagnosis_stage] || '—'}
        </span>
      </div>

      {/* Live Vitals */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-slate-300">
            {telemetry?.heart_rate ? `${telemetry.heart_rate} bpm` : '— bpm'}
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

      {/* Patient ID */}
      <p className="text-xs text-slate-600 mt-3 font-mono">{patient.id}</p>
    </div>
  );
}
