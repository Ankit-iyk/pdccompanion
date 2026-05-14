import { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown, RefreshCw } from 'lucide-react';
import { usePatients } from '../hooks/usePatients.js';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

// ── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_PREDICTIONS = {
  PD001: [
    { patient_id: 'PD001', prediction_type: 'tremor_severity',    confidence: 0.87, result: { label: 'Moderate-Severe', stage: 3, trend: 'worsening',  severity: 'high'   } },
    { patient_id: 'PD001', prediction_type: 'fall_risk',          confidence: 0.72, result: { label: 'High Risk',       score: 0.72, factors: ['gait instability', 'medication timing'], severity: 'high' } },
  ],
  PD002: [
    { patient_id: 'PD002', prediction_type: 'tremor_severity',    confidence: 0.91, result: { label: 'Severe',          stage: 4, trend: 'stable',     severity: 'critical' } },
    { patient_id: 'PD002', prediction_type: 'medication_response',confidence: 0.65, result: { label: 'Partial Response',recommendation: 'Consult neurologist for dosage adjustment', severity: 'medium' } },
  ],
  PD003: [
    { patient_id: 'PD003', prediction_type: 'tremor_severity',    confidence: 0.84, result: { label: 'Mild-Moderate',   stage: 2, trend: 'improving',  severity: 'medium' } },
    { patient_id: 'PD003', prediction_type: 'fall_risk',          confidence: 0.41, result: { label: 'Low Risk',        score: 0.41, factors: ['good balance score'], severity: 'low' } },
  ],
};

const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   avatar_initials: 'MT', age: 68, diagnosis_stage: 2 },
  { id: 'PD002', name: 'Eleanor Rodriguez', avatar_initials: 'ER', age: 72, diagnosis_stage: 3 },
  { id: 'PD003', name: 'James Chen',        avatar_initials: 'JC', age: 65, diagnosis_stage: 2 },
];

const typeLabels = {
  tremor_severity:     '🧠 Tremor Severity',
  fall_risk:           '⚠️ Fall Risk',
  medication_response: '💊 Medication Response',
};

// ── Sub-components ───────────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === 'worsening') return <TrendingDown className="w-4 h-4 text-red-400" />;
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function TrendBadge({ trend }) {
  if (!trend) return null;
  const map = {
    worsening: 'text-red-400 bg-red-500/10 border-red-500/20',
    improving: 'text-green-400 bg-green-500/10 border-green-500/20',
    stable:    'text-slate-400 bg-white/5 border-white/10',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${map[trend] || map.stable}`}>
      {trend}
    </span>
  );
}

function SeverityBadge({ severity }) {
  if (!severity) return null;
  const cls = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
  };
  return <span className={cls[severity] || 'badge-low'}>{severity}</span>;
}

function ConfidenceBar({ value }) {
  const pct   = Math.round(value * 100);
  const color = pct > 80 ? 'bg-green-500' : pct > 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function PredictionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="glass-card p-5 border border-white/5 space-y-4">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-2 w-full rounded-full" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const { patients }                    = usePatients();
  const { on, off }                     = useSocket() || {};
  const [selected, setSelected]         = useState('PD001');
  const [predictions, setPredictions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(null);

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;

  const loadPredictions = useCallback(() => {
    setLoading(true);
    api.get(`/predictions/${selected}`)
      .then(({ data }) => {
        const live = data.predictions || [];
        setPredictions(live.length ? live : (MOCK_PREDICTIONS[selected] || []));
        setLastRefresh(new Date());
      })
      .catch(() => {
        setPredictions(MOCK_PREDICTIONS[selected] || []);
        setLastRefresh(new Date());
      })
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => { loadPredictions(); }, [loadPredictions]);

  // Realtime: listen for new predictions pushed from AI team
  useEffect(() => {
    if (!on) return;
    const handler = (pred) => {
      if (pred.patient_id !== selected) return;
      setPredictions((prev) => {
        const filtered = prev.filter((p) => p.prediction_type !== pred.prediction_type);
        return [pred, ...filtered];
      });
      toast.success('🧠 New AI prediction received', { duration: 3000 });
      setLastRefresh(new Date());
    };
    on('new_prediction', handler);
    return () => off?.('new_prediction', handler);
  }, [on, off, selected]);

  const patient = displayPatients.find((p) => p.id === selected) || displayPatients[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" /> AI Insights
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ML model predictions · Clinical analysis
            {lastRefresh && <span className="ml-2 text-slate-600">· updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Patient selector */}
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              {displayPatients.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">{p.name || p.id}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Manual refresh */}
          <button
            onClick={loadPredictions}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-40"
            title="Refresh predictions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient header */}
      {patient && (
        <div className="glass-card p-5 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white font-bold shrink-0">
            {patient.avatar_initials || patient.name?.slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-white">{patient.name || patient.id}</p>
            <p className="text-xs text-slate-500">
              {patient.age ? `Age ${patient.age} · ` : ''}Stage {patient.diagnosis_stage || '—'} Parkinson's
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-green-400">{predictions.length} predictions</span>
          </div>
        </div>
      )}

      {/* Prediction cards */}
      {loading ? (
        <PredictionSkeleton />
      ) : predictions.length === 0 ? (
        <div className="glass-card p-12 border border-white/5 text-center">
          <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No predictions available for this patient.</p>
          <p className="text-xs text-slate-600 mt-1">AI team can POST to /api/predictions to add results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((pred, i) => (
            <div key={pred.id || i} className="glass-card p-5 border border-white/5 space-y-4 animate-fade-in">
              {/* Type + trend */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {typeLabels[pred.prediction_type] || pred.prediction_type}
                </p>
                <div className="flex items-center gap-2">
                  {pred.result?.trend && <TrendBadge trend={pred.result.trend} />}
                  {pred.result?.trend && <TrendIcon trend={pred.result.trend} />}
                </div>
              </div>

              {/* Label + severity + stage */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold text-white">{pred.result?.label || '—'}</span>
                {pred.result?.severity && <SeverityBadge severity={pred.result.severity} />}
                {pred.result?.stage && (
                  <span className="text-xs text-slate-500 ml-auto">→ Stage {pred.result.stage}</span>
                )}
              </div>

              {/* Confidence bar */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Model Confidence</p>
                <ConfidenceBar value={pred.confidence} />
              </div>

              {/* Risk factors */}
              {pred.result?.factors && (
                <div className="flex flex-wrap gap-1.5">
                  {pred.result.factors.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400">{f}</span>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              {pred.result?.recommendation && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 leading-relaxed">
                  💡 {pred.result.recommendation}
                </p>
              )}

              {/* Timestamp */}
              <p className="text-xs text-slate-600">
                {pred.created_at ? new Date(pred.created_at).toLocaleString() : 'Demo prediction — AI team not connected'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
