import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Activity, Thermometer, MapPin } from 'lucide-react';
import { usePatient } from '../hooks/usePatients.js';
import { usePatientTelemetry } from '../hooks/useTelemetry.js';
import { useAlerts } from '../hooks/useAlerts.js';
import TelemetryChart from '../components/TelemetryChart.jsx';
import DeviceStatus from '../components/DeviceStatus.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const MOCK_DEVICES = [
  { device_type: 'cap',      battery_level: 87, status: 'online',  firmware_version: '2.1.0' },
  { device_type: 'wristband',battery_level: 62, status: 'online',  firmware_version: '2.0.3' },
];

export default function PatientDetailsPage() {
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { patient, loading } = usePatient(id);
  const { data, current }    = usePatientTelemetry(id);
  const { alerts }           = useAlerts(id);

  const p = patient || { id, name: id, age: '—', diagnosis_stage: '—', avatar_initials: id?.slice(0,2) };

  const vitals = [
    { label: 'Heart Rate', value: current?.heart_rate ? `${current.heart_rate} bpm` : '— bpm', icon: Heart, color: 'text-red-400' },
    { label: 'Tremor',     value: current?.tremor_score != null ? `${(current.tremor_score * 100).toFixed(0)}%` : '—', icon: Activity, color: 'text-amber-400' },
    { label: 'Temp',       value: current?.temperature ? `${current.temperature}°C` : '—', icon: Thermometer, color: 'text-blue-400' },
    { label: 'Location',   value: current?.latitude ? 'Tracked' : 'Awaiting', icon: MapPin, color: 'text-green-400' },
  ];

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-white text-lg">
            {p.avatar_initials || p.name?.slice(0,2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{p.name}</h1>
            <p className="text-slate-500 text-sm">
              {p.age !== '—' ? `Age ${p.age}` : ''} · Patient ID: {id}
              {p.diagnosis_stage !== '—' ? ` · Stage ${p.diagnosis_stage}` : ''}
            </p>
          </div>
        </div>
        {current?.fall_detected && (
          <span className="ml-auto badge-critical animate-pulse-slow">🚨 Fall Detected</span>
        )}
      </div>

      {/* Live Vitals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {vitals.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Live Telemetry</h2>
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live
            </span>
          </div>
          <TelemetryChart data={data} patientId={id} />
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 border border-white/5">
            <h2 className="font-semibold text-white text-sm mb-3">Devices</h2>
            <DeviceStatus devices={patient?.pd_devices || MOCK_DEVICES} />
          </div>
          <div className="glass-card p-5 border border-white/5">
            <h2 className="font-semibold text-white text-sm mb-1">Emergency Contact</h2>
            <p className="text-slate-400 text-sm">{p.emergency_contact || '+91-98765-XXXXX'}</p>
          </div>
        </div>
      </div>

      {/* Alert History */}
      <div className="glass-card p-5 border border-white/5">
        <h2 className="font-semibold text-white text-sm mb-4">Alert History</h2>
        {alerts.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No alerts for this patient</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a, i) => (
              <div key={a.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className={`badge-${a.severity}`}>{a.severity}</span>
                <span className="text-sm text-slate-300 flex-1">{a.message}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.resolved ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {a.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
